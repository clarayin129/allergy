<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Agent context — AllergyCheck

Food allergy restaurant safety PWA. See CLAUDE.md for full project overview.

## Core model: community experiences, not AI verdicts

The app surfaces **user-submitted reports** ("I ate X here as someone with peanut allergy — here's what happened"), not AI-generated safety verdicts. This is intentional — AI dish classifications create legal liability and are unreliable for local restaurants with no menu data online. Never add back AI dish classification without explicit instruction.

Outcomes are: `"safe"` | `"cautious"` | `"reaction"`. There is no "SAFE/CAUTION/AVOID" dish classification anymore.

## What to know before making changes

**Frontend is `"use client"` heavy** — all pages that use geolocation, localStorage, or state need the directive. Server components are only for layout and static shells.

**Allergy profile flow**: raw input (allergies array + notes string) → `POST /api/allergy/interpret` → structured `AllergyProfile` → localStorage. Never store raw notes as the profile; always go through the interpreter.

**Restaurant meta cache** — when a user taps a `RestaurantCard`, `saveRestaurantMeta` stores `{place_id, name, address, cuisine}` in localStorage. The detail page reads this for display. Don't break this flow.

**Experience flow**:
- `GET /api/experiences/{place_id}?allergies=peanuts` — fetches reports, filtered by allergy overlap, returns `ExperiencesResponse` with `summary` (counts + AI insight) + `experiences` list
- `POST /api/experiences` — submits a new report, returns the created `Experience`
- After submit, the detail page updates its local state optimistically (no re-fetch needed)

**AI pipeline** — two Backboard calls in `backend/services/backboard_service.py`:
1. `interpret_allergy()` — onboarding, `json_output=True`
2. `summarize_experiences()` — per restaurant view, plain text output, factual summary only
Edit `backend/prompts/` to change AI behavior, not the Python.

**DEMO_MODE** — set `DEMO_MODE=true` in `backend/.env` to serve pre-baked data from `backend/demo_data/restaurants.json` (includes seeded experiences). Use for demos and testing without API calls.

## Outcome display

`SafetyBadge` maps outcomes to labels:
- `"safe"` → green "Ate safely"
- `"cautious"` → yellow "Used caution"
- `"reaction"` → red "Reaction reported"

`ExperienceFeed` sorts: reactions first, then cautious, then safe.

## Disclaimer

Every restaurant detail page must show: *"These are user-reported experiences, not medical advice. Always inform your server of your allergies."* Do not remove this.

## Adding a new experience field

1. Add the column to `experiences` table in `backend/models/database.py` with `ALTER TABLE ... ADD COLUMN` (catch the error if column exists)
2. Add the field to `SubmitExperienceRequest` and `Experience` in `backend/models/schemas.py`
3. Update `backend/routes/experiences.py` — `_row_to_experience` and `_dict_to_experience`
4. Update `components/SubmitExperienceForm.tsx` to show the new field
5. Update `components/ExperienceFeed.tsx` to display it
