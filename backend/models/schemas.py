from pydantic import BaseModel


class AllergyProfile(BaseModel):
    must_avoid: list[str]
    conditional: list[dict]
    safe_variants: list[dict]
    cross_contamination_sensitivity: str  # high | medium | low
    severity: str  # anaphylactic | severe | moderate


class InterpretAllergyRequest(BaseModel):
    allergies: list[str]
    notes: str = ""


class InterpretAllergyResponse(BaseModel):
    structured_profile: AllergyProfile


class Experience(BaseModel):
    id: int
    place_id: str
    dish_name: str
    allergies: list[str]
    outcome: str  # safe | reaction | cautious
    notes: str
    created_at: str


class ExperienceSummary(BaseModel):
    total: int
    safe_count: int
    reaction_count: int
    cautious_count: int
    ai_insight: str


class DishRating(BaseModel):
    name: str
    rating: str  # safe | caution | avoid
    reason: str
    from_report: bool = False


class ExperiencesResponse(BaseModel):
    summary: ExperienceSummary
    experiences: list[Experience]
    dish_ratings: list[DishRating] = []


class SubmitExperienceRequest(BaseModel):
    place_id: str
    restaurant_name: str
    dish_name: str = ""
    allergies: list[str]
    outcome: str  # safe | reaction | cautious
    notes: str = ""


class RestaurantSummary(BaseModel):
    place_id: str
    name: str
    address: str
    cuisine: str
    distance_meters: float
    rating: float | None = None
    photo_url: str | None = None
    experience_count: int = 0


class NearbyResponse(BaseModel):
    restaurants: list[RestaurantSummary]
