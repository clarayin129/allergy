import json
import os
from pathlib import Path

import aiosqlite
from fastapi import APIRouter, Query

from models.database import get_db_path
from models.schemas import NearbyResponse, RestaurantSummary
from services.google_places import nearby_restaurants

router = APIRouter()

DEMO_DATA_PATH = Path(__file__).parent.parent / "demo_data" / "restaurants.json"


def _load_demo_data() -> list[dict]:
    if DEMO_DATA_PATH.exists():
        return json.loads(DEMO_DATA_PATH.read_text())
    return []


async def _get_experience_counts(place_ids: list[str]) -> dict[str, int]:
    if not place_ids:
        return {}
    placeholders = ",".join("?" * len(place_ids))
    async with aiosqlite.connect(get_db_path()) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            f"SELECT place_id, COUNT(*) as cnt FROM experiences WHERE place_id IN ({placeholders}) GROUP BY place_id",
            place_ids,
        ) as cursor:
            rows = await cursor.fetchall()
    return {row["place_id"]: row["cnt"] for row in rows}


@router.get("/nearby", response_model=NearbyResponse)
async def get_nearby(
    lat: float = Query(...),
    lng: float = Query(...),
    radius: int = Query(default=1000),
    limit: int = Query(default=20),
):
    if os.environ.get("DEMO_MODE", "false").lower() == "true":
        demo = _load_demo_data()
        restaurants = [
            RestaurantSummary(
                place_id=r["place_id"],
                name=r["name"],
                address=r["address"],
                cuisine=r["cuisine"],
                distance_meters=r.get("distance_meters", 500),
                rating=r.get("rating"),
                photo_url=r.get("photo_url"),
                experience_count=len(r.get("experiences", [])),
            )
            for r in demo
        ]
        return NearbyResponse(restaurants=restaurants)

    places = await nearby_restaurants(lat, lng, radius, limit)
    place_ids = [p["place_id"] for p in places]
    counts = await _get_experience_counts(place_ids)

    restaurants = [
        RestaurantSummary(**p, experience_count=counts.get(p["place_id"], 0))
        for p in places
    ]
    return NearbyResponse(restaurants=restaurants)
