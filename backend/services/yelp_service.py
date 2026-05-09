import os
import httpx


YELP_API_BASE = "https://api.yelp.com/v3"


async def get_menu_and_reviews(place_name: str, address: str) -> tuple[list[dict], list[dict]]:
    api_key = os.environ.get("YELP_API_KEY", "")
    if not api_key:
        return [], []

    headers = {"Authorization": f"Bearer {api_key}"}

    # Search Yelp for the business by name + location
    async with httpx.AsyncClient(timeout=10) as client:
        search_resp = await client.get(
            f"{YELP_API_BASE}/businesses/search",
            headers=headers,
            params={"term": place_name, "location": address, "limit": 1},
        )
        if search_resp.status_code != 200:
            return [], []

        businesses = search_resp.json().get("businesses", [])
        if not businesses:
            return [], []

        yelp_id = businesses[0]["id"]

        # Fetch reviews (Yelp v3 gives up to 3 reviews free)
        reviews_resp = await client.get(
            f"{YELP_API_BASE}/businesses/{yelp_id}/reviews",
            headers=headers,
        )
        reviews = []
        if reviews_resp.status_code == 200:
            reviews = [
                {"text": r.get("text", ""), "rating": r.get("rating")}
                for r in reviews_resp.json().get("reviews", [])
            ]

    # Yelp Fusion doesn't provide menu data in the free tier.
    # Return empty menu; the AI will work from reviews + restaurant name heuristics.
    return [], reviews


def format_menu(menu: list[dict]) -> str:
    if not menu:
        return "Menu data not available."
    lines = []
    for section in menu:
        lines.append(f"\n## {section.get('name', 'Items')}")
        for item in section.get("items", []):
            desc = f" — {item['description']}" if item.get("description") else ""
            lines.append(f"- {item['name']}{desc}")
    return "\n".join(lines)


def format_reviews(reviews: list[dict]) -> str:
    if not reviews:
        return "No reviews available."
    lines = []
    for i, r in enumerate(reviews[:10], 1):
        rating = f"[{r['rating']}/5] " if r.get("rating") else ""
        lines.append(f"{i}. {rating}{r.get('text', '')}")
    return "\n".join(lines)
