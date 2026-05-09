import aiosqlite
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "allergy.db")


async def init_db():
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS experiences (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                place_id        TEXT NOT NULL,
                restaurant_name TEXT NOT NULL,
                dish_name       TEXT,
                allergies       TEXT NOT NULL,
                outcome         TEXT NOT NULL,
                notes           TEXT,
                created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        await db.execute(
            "CREATE INDEX IF NOT EXISTS idx_experiences_place ON experiences(place_id)"
        )
        await db.commit()


def get_db_path() -> str:
    return DB_PATH
