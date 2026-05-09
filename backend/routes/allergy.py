from fastapi import APIRouter, HTTPException

from models.schemas import InterpretAllergyRequest, InterpretAllergyResponse, AllergyProfile
from services.backboard_service import interpret_allergy

router = APIRouter()


@router.post("/interpret", response_model=InterpretAllergyResponse)
async def interpret_allergy_route(body: InterpretAllergyRequest):
    try:
        profile_dict = await interpret_allergy(body.allergies, body.notes)
        profile = AllergyProfile(**profile_dict)
        return InterpretAllergyResponse(structured_profile=profile)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Allergy interpretation failed: {str(e)}")
