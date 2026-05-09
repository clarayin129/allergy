<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Agent context — AllergyCheck

Food allergy restaurant safety PWA. See CLAUDE.md for full project overview.

## What to know before making changes

**Frontend is `"use client"` heavy** — all pages that use geolocation, localStorage, or state need the directive. Server components are only used for layout and static shells.

**Allergy profile flows**: raw input (allergies array + notes string) → `POST /api/allergy/interpret` → structured `AllergyProfile` → localStorage. Never store raw notes as the profile; always go through the interpreter.

**Restaurant meta cache** — when a user taps a restaurant card, `saveRestaurantMeta` stores `{place_id, name, address, cuisine}` in localStorage. The detail page reads this and passes it to the analyze call so the AI has cuisine context. Don't break this flow.

**AI pipeline** — two Backboard calls in `backend/services/backboard_service.py`. Both use `json_output=True` and `stream=False`. The system prompts are in `backend/prompts/` — edit those files to change AI behavior, not the Python code.

**SQLite cache** — restaurant analyses are cached by `(place_id, SHA256(allergy_profile))`. If you change the `AllergyProfile` schema, existing caches for that profile hash become stale but won't cause errors (they'll just be regenerated on next request).

**DEMO_MODE** — set `DEMO_MODE=true` in `backend/.env` to bypass all API calls and serve pre-baked data from `backend/demo_data/restaurants.json`. Use this for demos and testing.

## Safety classification system

Dishes are classified as `SAFE | CAUTION | AVOID`. The `overall_risk` field on a restaurant is `low | medium | high`. The frontend `SafetyBadge` component maps both scales to the same green/yellow/red display.

## Adding a new data source

1. Add a service in `backend/services/`
2. Fetch data in `backend/routes/restaurants.py` inside the `POST /{place_id}/analyze` handler, before the Backboard call
3. Pass the data into `analyze_restaurant(...)` in `backboard_service.py`
4. Inject it into the system prompt via a `{placeholder}` in `restaurant_analyzer.txt`
5. Cache raw data via `save_raw` / `get_cached_raw` in `cache_service.py`
