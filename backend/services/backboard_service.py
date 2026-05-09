import json
import os
import re
from pathlib import Path

from backboard import BackboardClient

PROMPTS_DIR = Path(__file__).parent.parent / "prompts"


def _load_prompt(name: str) -> str:
    return (PROMPTS_DIR / name).read_text()


def _extract_json(text: str) -> dict:
    # Strip markdown code fences if present
    text = re.sub(r"```(?:json)?\s*", "", text).strip().rstrip("```").strip()
    return json.loads(text)


async def interpret_allergy(allergies: list[str], notes: str) -> dict:
    client = BackboardClient(api_key=os.environ["BACKBOARD_API_KEY"])
    system_prompt = _load_prompt("allergy_interpreter.txt")
    message = f"Selected allergies: {', '.join(allergies) if allergies else 'none'}\nAdditional notes: {notes or 'none'}"

    response = await client.send_message(
        message,
        system_prompt=system_prompt,
        json_output=True,
        stream=False,
    )
    return _extract_json(response.content)


async def analyze_restaurant(
    allergy_profile: dict,
    review_text: str,
    restaurant_name: str = "",
    cuisine: str = "",
    website_text: str = "",
) -> dict:
    client = BackboardClient(api_key=os.environ["BACKBOARD_API_KEY"])
    website_section = f"\nWEBSITE / MENU TEXT (may contain dish names and ingredients):\n{website_text[:2000]}" if website_text else ""
    system_prompt = (
        _load_prompt("restaurant_analyzer.txt")
        .replace("{profile}", json.dumps(allergy_profile, indent=2))
        .replace("{restaurant_name}", restaurant_name or "Unknown")
        .replace("{cuisine}", cuisine or "Unknown")
        .replace("{reviews}", review_text or "No reviews available.")
        .replace("{website_text_section}", website_section)
    )

    response = await client.send_message(
        "Analyze this restaurant for the user's allergy profile as instructed.",
        system_prompt=system_prompt,
        json_output=True,
        stream=False,
    )
    return _extract_json(response.content)
