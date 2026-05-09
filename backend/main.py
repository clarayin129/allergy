import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

from models.database import init_db
from routes.allergy import router as allergy_router
from routes.restaurants import router as restaurants_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(title="AllergyCheck API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(allergy_router, prefix="/api/allergy", tags=["allergy"])
app.include_router(restaurants_router, prefix="/api/restaurants", tags=["restaurants"])


@app.get("/api/health")
async def health():
    return {"status": "ok", "demo_mode": os.environ.get("DEMO_MODE", "false")}
