import math
import os
import re

import httpx


PLACES_API_BASE = "https://maps.googleapis.com/maps/api/place"


async def nearby_restaurants(lat: float, lng: float, radius: int, limit: int) -> list[dict]:
    api_key = os.environ.get("GOOGLE_PLACES_API_KEY", "")
    if not api_key:
        return []

    params = {
        "location": f"{lat},{lng}",
        "radius": radius,
        "type": "restaurant",
        "key": api_key,
    }
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(f"{PLACES_API_BASE}/nearbysearch/json", params=params)
        resp.raise_for_status()
        data = resp.json()

    results = []
    for place in data.get("results", [])[:limit]:
        geometry = place.get("geometry", {}).get("location", {})
        photo_ref = None
        if place.get("photos"):
            photo_ref = place["photos"][0].get("photo_reference")

        photo_url = None
        if photo_ref and api_key:
            photo_url = (
                f"{PLACES_API_BASE}/photo?maxwidth=400"
                f"&photo_reference={photo_ref}&key={api_key}"
            )

        # Compute straight-line distance (approximate)
        dlat = math.radians(geometry.get("lat", lat) - lat)
        dlng = math.radians(geometry.get("lng", lng) - lng)
        a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat)) * math.cos(
            math.radians(geometry.get("lat", lat))
        ) * math.sin(dlng / 2) ** 2
        distance_m = 6371000 * 2 * math.asin(math.sqrt(a))

        results.append({
            "place_id": place.get("place_id", ""),
            "name": place.get("name", ""),
            "address": place.get("vicinity", ""),
            "cuisine": _extract_cuisine(place.get("types", [])),
            "distance_meters": round(distance_m),
            "rating": place.get("rating"),
            "photo_url": photo_url,
        })

    return results


async def get_place_details(place_id: str) -> dict:
    """Fetch detailed info: reviews, website, description. Returns {} on failure."""
    api_key = os.environ.get("GOOGLE_PLACES_API_KEY", "")
    if not api_key:
        return {}

    fields = "name,website,editorial_summary,reviews,url"
    params = {"place_id": place_id, "fields": fields, "key": api_key}
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(f"{PLACES_API_BASE}/details/json", params=params)
        if resp.status_code != 200:
            return {}
        data = resp.json()

    result = data.get("result", {})
    reviews = [
        {"text": r.get("text", ""), "rating": r.get("rating")}
        for r in result.get("reviews", [])
        if r.get("text")
    ]
    return {
        "website": result.get("website"),
        "description": result.get("editorial_summary", {}).get("overview", ""),
        "reviews": reviews,
        "maps_url": result.get("url", ""),
    }


async def fetch_website_text(url: str) -> str:
    """Fetch a restaurant website and return cleaned plain text (max 3000 chars)."""
    if not url:
        return ""
    try:
        async with httpx.AsyncClient(timeout=8, follow_redirects=True) as client:
            resp = await client.get(url, headers={"User-Agent": "Mozilla/5.0"})
            if resp.status_code != 200:
                return ""
            html = resp.text
        # Strip tags, collapse whitespace, keep meaningful text
        text = re.sub(r"<script[^>]*>.*?</script>", " ", html, flags=re.S)
        text = re.sub(r"<style[^>]*>.*?</style>", " ", text, flags=re.S)
        text = re.sub(r"<[^>]+>", " ", text)
        text = re.sub(r"\s+", " ", text).strip()
        return text[:3000]
    except Exception:
        return ""


def _extract_cuisine(types: list[str]) -> str:
    skip = {"restaurant", "food", "point_of_interest", "establishment"}
    for t in types:
        if t not in skip:
            return t.replace("_", " ").title()
    return "Restaurant"
