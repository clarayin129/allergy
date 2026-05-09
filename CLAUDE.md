@AGENTS.md

# AllergyCheck

A hackathon PWA that helps people with food allergies safely choose restaurants and menu items.

## What it does

Users enter their allergy profile (selected allergens + freeform notes like "I can tolerate small amounts of egg but not baked egg"). The app finds nearby restaurants and uses AI to classify each dish as SAFE, CAUTION, or AVOID — pulling signals from Google reviews and the restaurant's own website.

Core user flow:
1. Onboarding — select allergies + add freeform notes → AI interprets into a structured profile stored in localStorage
2. Home — tap "Find restaurants near me" → Google Places returns nearby restaurants
3. Restaurant detail — AI analyzes the restaurant using cuisine-type knowledge, Google reviews, and website menu text → shows dish-by-dish safety breakdown with warnings

## Tech stack

**Frontend** — Next.js 16 (App Router, Turbopack), React, Tailwind CSS, PWA via next-pwa. No auth — allergy profile lives in localStorage.

**Backend** — FastAPI + SQLite. Runs on port 8000. Results are cached in SQLite so repeat visits are instant.

**AI** — Backboard SDK (`backboard-sdk`) orchestrates two LLM calls:
1. Allergy Interpreter — converts raw user notes into structured JSON constraints
2. Restaurant Analyzer — classifies dishes using cuisine knowledge + reviews + website text

**Data sources**
- Google Places Nearby Search — restaurant discovery
- Google Places Details — up to 5 Google reviews + restaurant website URL
- Website scraping — fetches the restaurant's own site for menu text (3000 char limit)

## Project structure

```
/                   Next.js frontend (App Router)
  app/
    page.tsx              Home: geolocation → restaurant list
    onboarding/page.tsx   Allergy setup
    restaurants/[id]/     Restaurant detail + dish analysis
  components/             AllergySelector, SafetyBadge, DishList, RestaurantCard, etc.
  lib/
    api.ts                Typed fetch wrappers for all backend calls
    storage.ts            localStorage helpers (allergy profile, restaurant meta cache)
  hooks/
    useAllergyProfile.ts
    useGeolocation.ts

backend/
  main.py               FastAPI app entry point (port 8000)
  routes/
    allergy.py            POST /api/allergy/interpret
    restaurants.py        GET /api/restaurants/nearby, POST /api/restaurants/{id}/analyze
  services/
    backboard_service.py  Backboard AI calls (interpret + analyze)
    google_places.py      Places nearby search, place details, website fetch
    yelp_service.py       Yelp review formatting helpers
    cache_service.py      SQLite read/write (analyses + raw data cache)
  models/
    schemas.py            Pydantic models
    database.py           SQLite init
  prompts/
    allergy_interpreter.txt
    restaurant_analyzer.txt
  demo_data/
    restaurants.json      3 seeded restaurants for DEMO_MODE=true
  .env                    API keys (gitignored)
```

## Running locally

```bash
# Backend (port 8000)
cd backend
uvicorn main:app --reload

# Frontend (port 3000) — separate terminal
npm run dev
```

## Environment variables

Backend `backend/.env`:
```
BACKBOARD_API_KEY=...
GOOGLE_PLACES_API_KEY=...
YELP_API_KEY=...
DEMO_MODE=false   # set true to use seeded restaurants without API calls
```

Frontend: `NEXT_PUBLIC_API_URL` defaults to `http://localhost:8000` if unset.

## Key design decisions

- **No auth** — allergy profile stays in localStorage, sent to the backend only when triggering an analysis
- **2 AI calls, not 4 agents** — Allergy Interpreter + Restaurant Analyzer. Simple, fast, debuggable.
- **SQLite cache keyed by (place_id, allergy_hash)** — same restaurant + same profile = instant response, no AI call
- **Cuisine-type reasoning** — the LLM knows what's typically on a Thai vs Italian menu; this fills the gap when no menu data is available
- **Google Places Details over Yelp** — gives 5 reviews + website URL for free; website text is scraped and passed to the AI as menu context
- **DEMO_MODE=true** — loads 3 pre-baked restaurant analyses for reliable demo presentations
