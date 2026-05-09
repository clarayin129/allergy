import { AllergyProfile } from "./storage";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export interface RestaurantSummary {
  place_id: string;
  name: string;
  address: string;
  cuisine: string;
  distance_meters: number;
  rating: number | null;
  photo_url: string | null;
  experience_count: number;
}

export interface Experience {
  id: number;
  place_id: string;
  dish_name: string;
  allergies: string[];
  outcome: "safe" | "reaction" | "cautious";
  notes: string;
  created_at: string;
}

export interface ExperienceSummary {
  total: number;
  safe_count: number;
  reaction_count: number;
  cautious_count: number;
  ai_insight: string;
}

export interface ExperiencesResponse {
  summary: ExperienceSummary;
  experiences: Experience[];
}

export interface SubmitExperienceRequest {
  place_id: string;
  restaurant_name: string;
  dish_name?: string;
  allergies: string[];
  outcome: "safe" | "reaction" | "cautious";
  notes?: string;
}

export async function interpretAllergy(
  allergies: string[],
  notes: string
): Promise<AllergyProfile> {
  const res = await fetch(`${API_BASE}/api/allergy/interpret`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ allergies, notes }),
  });
  if (!res.ok) throw new Error(`Allergy interpretation failed: ${res.status}`);
  const data = await res.json();
  return data.structured_profile as AllergyProfile;
}

export async function getNearbyRestaurants(
  lat: number,
  lng: number,
  radius = 1000,
  limit = 20
): Promise<RestaurantSummary[]> {
  const params = new URLSearchParams({
    lat: String(lat),
    lng: String(lng),
    radius: String(radius),
    limit: String(limit),
  });
  const res = await fetch(`${API_BASE}/api/restaurants/nearby?${params}`);
  if (!res.ok) throw new Error(`Nearby search failed: ${res.status}`);
  const data = await res.json();
  return data.restaurants as RestaurantSummary[];
}

export async function getExperiences(
  placeId: string,
  allergies: string[]
): Promise<ExperiencesResponse> {
  const params = new URLSearchParams();
  if (allergies.length) params.set("allergies", allergies.join(","));
  const res = await fetch(`${API_BASE}/api/experiences/${placeId}?${params}`);
  if (!res.ok) throw new Error(`Failed to load experiences: ${res.status}`);
  return res.json() as Promise<ExperiencesResponse>;
}

export async function submitExperience(
  data: SubmitExperienceRequest
): Promise<Experience> {
  const res = await fetch(`${API_BASE}/api/experiences`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to submit experience: ${res.status}`);
  return res.json() as Promise<Experience>;
}
