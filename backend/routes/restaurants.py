import json
import os
from pathlib import Path

from fastapi import APIRouter, HTTPException, Query

from models.schemas import (
    AnalyzeRequest,
    RestaurantAnalysis,
    Dish,
    NearbyResponse,
    RestaurantSummary,
)
from services.backboard_service import analyze_restaurant
from services.cache_service import (
    get_cached_analysis,
    save_analysis,
    get_cached_raw,
    save_raw,
    get_cached_risks,
)
from services.google_places import nearby_restaurants, get_place_details, fetch_website_text
from services.yelp_service import format_reviews

router = APIRouter()

DEMO_DATA_PATH = Path(__file__).parent.parent / "demo_data" / "restaurants.json"


def _load_demo_data() -> list[dict]:
    if DEMO_DATA_PATH.exists():
        return json.loads(DEMO_DATA_PATH.read_text())
    return []


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
                cached_risk=r.get("overall_risk"),
            )
            for r in demo
        ]
        return NearbyResponse(restaurants=restaurants)

    places = await nearby_restaurants(lat, lng, radius, limit)
    place_ids = [p["place_id"] for p in places]
    cached_risks = await get_cached_risks(place_ids)

    restaurants = [
        RestaurantSummary(
            **p,
            cached_risk=cached_risks.get(p["place_id"]),
        )
        for p in places
    ]
    return NearbyResponse(restaurants=restaurants)


@router.post("/{place_id}/analyze", response_model=RestaurantAnalysis)
async def analyze_restaurant_route(place_id: str, body: AnalyzeRequest):
    profile_dict = body.allergy_profile.model_dump()

    # Demo mode: return pre-baked analysis from seed data
    if os.environ.get("DEMO_MODE", "false").lower() == "true":
        demo = _load_demo_data()
        for r in demo:
            if r["place_id"] == place_id:
                analysis_data = r.get("analysis", {})
                return RestaurantAnalysis(
                    dishes=[Dish(**d) for d in analysis_data.get("dishes", [])],
                    warnings=analysis_data.get("warnings", []),
                    overall_risk=analysis_data.get("overall_risk", "medium"),
                    summary=analysis_data.get("summary", "No summary available."),
                )
        raise HTTPException(status_code=404, detail="Restaurant not found in demo data")

    # Check analysis cache
    cached = await get_cached_analysis(place_id, profile_dict)
    if cached:
        return RestaurantAnalysis(
            dishes=[Dish(**d) for d in cached.get("dishes", [])],
            warnings=cached.get("warnings", []),
            overall_risk=cached.get("overall_risk", "medium"),
            summary=cached.get("summary", ""),
        )

    # Fetch reviews + website text (cached separately)
    raw = await get_cached_raw(place_id)
    if raw is None:
        details = await get_place_details(place_id)
        google_reviews = details.get("reviews", [])
        website_text = await fetch_website_text(details.get("website", ""))
        await save_raw(place_id, body.restaurant_name or place_id, [], google_reviews, website_text)
        raw = {"menu": [], "reviews": google_reviews, "website_text": website_text}

    review_text = format_reviews(raw.get("reviews", []))
    website_text = raw.get("website_text", "")

    # Run AI analysis
    try:
        result = await analyze_restaurant(
            profile_dict,
            review_text,
            restaurant_name=body.restaurant_name,
            cuisine=body.restaurant_cuisine,
            website_text=website_text,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI analysis failed: {str(e)}")

    await save_analysis(place_id, profile_dict, result)

    return RestaurantAnalysis(
        dishes=[Dish(**d) for d in result.get("dishes", [])],
        warnings=result.get("warnings", []),
        overall_risk=result.get("overall_risk", "medium"),
        summary=result.get("summary", ""),
    )
