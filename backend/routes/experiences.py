import json
import os
from pathlib import Path

import aiosqlite
from fastapi import APIRouter, HTTPException, Query

from models.database import get_db_path
from models.schemas import (
    Experience,
    ExperienceSummary,
    ExperiencesResponse,
    SubmitExperienceRequest,
)
from services.backboard_service import summarize_experiences

router = APIRouter()

VALID_OUTCOMES = {"safe", "reaction", "cautious"}
DEMO_DATA_PATH = Path(__file__).parent.parent / "demo_data" / "restaurants.json"


def _load_demo_experiences(place_id: str) -> list[dict]:
    if not DEMO_DATA_PATH.exists():
        return []
    data = json.loads(DEMO_DATA_PATH.read_text())
    for r in data:
        if r["place_id"] == place_id:
            return r.get("experiences", [])
    return []


@router.post("", response_model=Experience)
async def submit_experience(body: SubmitExperienceRequest):
    if body.outcome not in VALID_OUTCOMES:
        raise HTTPException(status_code=422, detail=f"outcome must be one of: {VALID_OUTCOMES}")
    if not body.allergies:
        raise HTTPException(status_code=422, detail="allergies must not be empty")

    async with aiosqlite.connect(get_db_path()) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute(
            """
            INSERT INTO experiences (place_id, restaurant_name, dish_name, allergies, outcome, notes)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                body.place_id,
                body.restaurant_name,
                body.dish_name,
                json.dumps(body.allergies),
                body.outcome,
                body.notes,
            ),
        )
        await db.commit()
        async with db.execute(
            "SELECT * FROM experiences WHERE id=?", (cursor.lastrowid,)
        ) as c:
            row = await c.fetchone()

    return _row_to_experience(row)


@router.get("/{place_id}", response_model=ExperiencesResponse)
async def get_experiences(
    place_id: str,
    allergies: str = Query(default=""),
):
    allergy_filter = [a.strip() for a in allergies.split(",") if a.strip()] if allergies else []

    if os.environ.get("DEMO_MODE", "false").lower() == "true":
        raw = _load_demo_experiences(place_id)
        experiences = [_dict_to_experience(i, r) for i, r in enumerate(raw, 1)]
    else:
        async with aiosqlite.connect(get_db_path()) as db:
            db.row_factory = aiosqlite.Row
            async with db.execute(
                "SELECT * FROM experiences WHERE place_id=? ORDER BY created_at DESC",
                (place_id,),
            ) as cursor:
                rows = await cursor.fetchall()
        experiences = [_row_to_experience(r) for r in rows]

    # Filter by allergy overlap if requested
    if allergy_filter:
        experiences = [
            e for e in experiences
            if any(a in e.allergies for a in allergy_filter)
        ]

    safe_count = sum(1 for e in experiences if e.outcome == "safe")
    reaction_count = sum(1 for e in experiences if e.outcome == "reaction")
    cautious_count = sum(1 for e in experiences if e.outcome == "cautious")

    # Get restaurant name from first experience (best effort)
    restaurant_name = ""
    if os.environ.get("DEMO_MODE", "false").lower() == "true":
        raw_all = _load_demo_experiences(place_id)
        restaurant_name = raw_all[0].get("restaurant_name", "") if raw_all else ""
    elif experiences:
        async with aiosqlite.connect(get_db_path()) as db:
            db.row_factory = aiosqlite.Row
            async with db.execute(
                "SELECT restaurant_name FROM experiences WHERE place_id=? LIMIT 1", (place_id,)
            ) as c:
                r = await c.fetchone()
                if r:
                    restaurant_name = r["restaurant_name"]

    ai_insight = await summarize_experiences(
        restaurant_name=restaurant_name,
        allergies=allergy_filter,
        experiences=experiences,
    )

    return ExperiencesResponse(
        summary=ExperienceSummary(
            total=len(experiences),
            safe_count=safe_count,
            reaction_count=reaction_count,
            cautious_count=cautious_count,
            ai_insight=ai_insight,
        ),
        experiences=experiences,
    )


def _row_to_experience(row) -> Experience:
    return Experience(
        id=row["id"],
        place_id=row["place_id"],
        dish_name=row["dish_name"] or "",
        allergies=json.loads(row["allergies"]),
        outcome=row["outcome"],
        notes=row["notes"] or "",
        created_at=str(row["created_at"]),
    )


def _dict_to_experience(idx: int, d: dict) -> Experience:
    return Experience(
        id=idx,
        place_id=d.get("place_id", ""),
        dish_name=d.get("dish_name", ""),
        allergies=d.get("allergies", []),
        outcome=d.get("outcome", "safe"),
        notes=d.get("notes", ""),
        created_at=d.get("created_at", "2025-01-01 00:00:00"),
    )
