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
  cached_risk: "low" | "medium" | "high" | null;
}

export interface Dish {
  name: string;
  classification: "SAFE" | "CAUTION" | "AVOID";
  reason: string;
}

export interface RestaurantAnalysis {
  dishes: Dish[];
  warnings: string[];
  overall_risk: "low" | "medium" | "high";
  summary: string;
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

export async function analyzeRestaurant(
  placeId: string,
  profile: AllergyProfile,
  restaurantName?: string,
  restaurantAddress?: string,
  restaurantCuisine?: string
): Promise<RestaurantAnalysis> {
  const res = await fetch(`${API_BASE}/api/restaurants/${placeId}/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      allergy_profile: profile,
      restaurant_name: restaurantName ?? "",
      restaurant_address: restaurantAddress ?? "",
      restaurant_cuisine: restaurantCuisine ?? "",
    }),
  });
  if (!res.ok) throw new Error(`Analysis failed: ${res.status}`);
  return res.json() as Promise<RestaurantAnalysis>;
}
