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


class Dish(BaseModel):
    name: str
    classification: str  # SAFE | CAUTION | AVOID
    reason: str


class RestaurantAnalysis(BaseModel):
    dishes: list[Dish]
    warnings: list[str]
    overall_risk: str  # low | medium | high
    summary: str


class AnalyzeRequest(BaseModel):
    allergy_profile: AllergyProfile
    restaurant_name: str = ""
    restaurant_address: str = ""
    restaurant_cuisine: str = ""


class RestaurantSummary(BaseModel):
    place_id: str
    name: str
    address: str
    cuisine: str
    distance_meters: float
    rating: float | None = None
    photo_url: str | None = None
    cached_risk: str | None = None


class NearbyResponse(BaseModel):
    restaurants: list[RestaurantSummary]
