# AllergyCheck

A PWA that helps people with food allergies safely choose restaurants — powered by crowdsourced experiences, not AI guesses.

## What it does

Users set up an allergy profile (selected allergens + freeform notes). The app finds nearby restaurants and shows community-reported experiences from people with the same allergies. Users can submit their own reports after eating somewhere.

**Core flow:**
1. **Onboarding** — pick allergens + add notes → AI interprets into a structured profile
2. **Home** — find restaurants nearby, see how many reports each has
3. **Restaurant detail** — read what people with your allergies experienced, submit your own

**Why community reports, not AI verdicts:**  
Telling someone a dish is "safe" is a legal liability and a data problem — local restaurants have no structured menu data online. "2 of 3 people with peanut allergy ate here without issue" is a fact. "This dish is Safe" is a claim we can't back up.

## Running locally

```bash
# Backend (port 8000)
cd backend
uvicorn main:app --reload

# Frontend (port 3000) — separate terminal
npm run dev
```

## Environment variables

Create `backend/.env`:
```
BACKBOARD_API_KEY=...
GOOGLE_PLACES_API_KEY=...
YELP_API_KEY=...
DEMO_MODE=false
```

Set `DEMO_MODE=true` to run entirely on seeded data (no external API calls) — useful for demos.

## Tech stack

- **Frontend**: Next.js 16 (App Router), React, Tailwind CSS, PWA
- **Backend**: FastAPI + SQLite, Python
- **AI**: Backboard SDK — allergy profile interpreter + experience summarizer
- **Data**: Google Places API for restaurant discovery

## Deployment

- Frontend → Vercel (`vercel deploy`)
- Backend → Vultr Cloud Compute (Ubuntu 22.04, Nginx + uvicorn)
