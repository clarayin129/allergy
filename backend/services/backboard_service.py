import json
import os
import re
from pathlib import Path

from backboard import BackboardClient

PROMPTS_DIR = Path(__file__).parent.parent / "prompts"


def _load_prompt(name: str) -> str:
    return (PROMPTS_DIR / name).read_text()


def _extract_json(text: str) -> dict:
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


async def analyze_dishes(
    restaurant_name: str,
    cuisine: str,
    allergies: list[str],
    experiences: list,
) -> list[dict]:
    if not allergies:
        return []

    client = BackboardClient(api_key=os.environ["BACKBOARD_API_KEY"])

    experiences_text = (
        "\n".join(
            f"- Outcome: {e.outcome}"
            + (f", Dish: {e.dish_name}" if e.dish_name else "")
            + (f", Notes: {e.notes}" if e.notes else "")
            for e in experiences
        )
        if experiences
        else "No community reports yet."
    )

    system_prompt = (
        _load_prompt("dish_analyzer.txt")
        .replace("{restaurant_name}", restaurant_name or "this restaurant")
        .replace("{cuisine}", cuisine or "this cuisine")
        .replace("{allergies}", ", ".join(allergies))
        .replace("{experiences_text}", experiences_text)
    )

    response = await client.send_message(
        "Rate the dishes at this restaurant for my allergies.",
        system_prompt=system_prompt,
        json_output=True,
        stream=False,
    )
    return _extract_json(response.content).get("dishes", [])


async def summarize_experiences(
    restaurant_name: str,
    allergies: list[str],
    experiences: list,
) -> str:
    if not experiences:
        return "No reports yet from people with these allergies. Be the first to share your experience."

    client = BackboardClient(api_key=os.environ["BACKBOARD_API_KEY"])

    experiences_text = "\n".join(
        f"- Outcome: {e.outcome}"
        + (f", Dish: {e.dish_name}" if e.dish_name else "")
        + (f", Notes: {e.notes}" if e.notes else "")
        for e in experiences
    )

    system_prompt = (
        _load_prompt("experience_summarizer.txt")
        .replace("{restaurant_name}", restaurant_name or "this restaurant")
        .replace("{allergies}", ", ".join(allergies) if allergies else "various allergies")
        .replace("{experiences_text}", experiences_text)
    )

    response = await client.send_message(
        "Summarize these community reports.",
        system_prompt=system_prompt,
        stream=False,
    )
    return (response.content or "").strip()
