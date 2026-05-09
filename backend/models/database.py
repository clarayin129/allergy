import aiosqlite
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "allergy.db")


async def init_db():
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS restaurant_raw_data (
                place_id     TEXT PRIMARY KEY,
                name         TEXT,
                menu_json    TEXT,
                reviews_json TEXT,
                website_text TEXT,
                fetched_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        # Add website_text column if upgrading from an older DB
        try:
            await db.execute("ALTER TABLE restaurant_raw_data ADD COLUMN website_text TEXT")
        except Exception:
            pass
        await db.execute("""
            CREATE TABLE IF NOT EXISTS restaurant_analyses (
                id            INTEGER PRIMARY KEY AUTOINCREMENT,
                place_id      TEXT NOT NULL,
                allergy_hash  TEXT NOT NULL,
                analysis_json TEXT NOT NULL,
                created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(place_id, allergy_hash)
            )
        """)
        await db.commit()


def get_db_path() -> str:
    return DB_PATH
