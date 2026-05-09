import aiosqlite
import hashlib
import json

from models.database import get_db_path


def _allergy_hash(profile: dict) -> str:
    canonical = json.dumps(profile, sort_keys=True)
    return hashlib.sha256(canonical.encode()).hexdigest()


async def get_cached_analysis(place_id: str, profile: dict) -> dict | None:
    h = _allergy_hash(profile)
    async with aiosqlite.connect(get_db_path()) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT analysis_json FROM restaurant_analyses WHERE place_id=? AND allergy_hash=?",
            (place_id, h),
        ) as cursor:
            row = await cursor.fetchone()
    if row:
        return json.loads(row["analysis_json"])
    return None


async def save_analysis(place_id: str, profile: dict, analysis: dict):
    h = _allergy_hash(profile)
    async with aiosqlite.connect(get_db_path()) as db:
        await db.execute(
            """
            INSERT INTO restaurant_analyses (place_id, allergy_hash, analysis_json)
            VALUES (?, ?, ?)
            ON CONFLICT(place_id, allergy_hash) DO UPDATE SET
                analysis_json=excluded.analysis_json,
                created_at=CURRENT_TIMESTAMP
            """,
            (place_id, h, json.dumps(analysis)),
        )
        await db.commit()


async def get_cached_raw(place_id: str) -> dict | None:
    async with aiosqlite.connect(get_db_path()) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT menu_json, reviews_json, website_text FROM restaurant_raw_data WHERE place_id=?",
            (place_id,),
        ) as cursor:
            row = await cursor.fetchone()
    if row:
        return {
            "menu": json.loads(row["menu_json"]) if row["menu_json"] else [],
            "reviews": json.loads(row["reviews_json"]) if row["reviews_json"] else [],
            "website_text": row["website_text"] or "",
        }
    return None


async def save_raw(place_id: str, name: str, menu: list, reviews: list, website_text: str = ""):
    async with aiosqlite.connect(get_db_path()) as db:
        await db.execute(
            """
            INSERT INTO restaurant_raw_data (place_id, name, menu_json, reviews_json, website_text)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(place_id) DO UPDATE SET
                menu_json=excluded.menu_json,
                reviews_json=excluded.reviews_json,
                website_text=excluded.website_text,
                fetched_at=CURRENT_TIMESTAMP
            """,
            (place_id, name, json.dumps(menu), json.dumps(reviews), website_text),
        )
        await db.commit()


async def get_cached_risks(place_ids: list[str]) -> dict[str, str]:
    """Return {place_id: overall_risk} for any cached analyses matching any allergy hash."""
    if not place_ids:
        return {}
    placeholders = ",".join("?" * len(place_ids))
    async with aiosqlite.connect(get_db_path()) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            f"""
            SELECT place_id, analysis_json
            FROM restaurant_analyses
            WHERE place_id IN ({placeholders})
            GROUP BY place_id
            """,
            place_ids,
        ) as cursor:
            rows = await cursor.fetchall()
    result = {}
    for row in rows:
        try:
            analysis = json.loads(row["analysis_json"])
            result[row["place_id"]] = analysis.get("overall_risk", "unknown")
        except Exception:
            pass
    return result
