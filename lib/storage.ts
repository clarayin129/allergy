export interface AllergyProfile {
  must_avoid: string[];
  conditional: { ingredient: string; note: string }[];
  safe_variants: { ingredient: string; note: string }[];
  cross_contamination_sensitivity: "high" | "medium" | "low";
  severity: "anaphylactic" | "severe" | "moderate";
}

const PROFILE_KEY = "allergyProfile";
const RAW_KEY = "allergyRaw";

export interface RawAllergyInput {
  allergies: string[];
  notes: string;
}

export function saveAllergyProfile(profile: AllergyProfile): void {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function loadAllergyProfile(): AllergyProfile | null {
  const raw = localStorage.getItem(PROFILE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AllergyProfile;
  } catch {
    return null;
  }
}

export function clearAllergyProfile(): void {
  localStorage.removeItem(PROFILE_KEY);
  localStorage.removeItem(RAW_KEY);
}

export function saveRawInput(input: RawAllergyInput): void {
  localStorage.setItem(RAW_KEY, JSON.stringify(input));
}

export function loadRawInput(): RawAllergyInput | null {
  const raw = localStorage.getItem(RAW_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as RawAllergyInput;
  } catch {
    return null;
  }
}

const RESTAURANT_CACHE_KEY = "restaurantCache";

export interface RestaurantMeta {
  place_id: string;
  name: string;
  address: string;
  cuisine: string;
}

export function saveRestaurantMeta(meta: RestaurantMeta): void {
  const existing = loadRestaurantCache();
  existing[meta.place_id] = meta;
  localStorage.setItem(RESTAURANT_CACHE_KEY, JSON.stringify(existing));
}

export function loadRestaurantMeta(placeId: string): RestaurantMeta | null {
  const cache = loadRestaurantCache();
  return cache[placeId] ?? null;
}

function loadRestaurantCache(): Record<string, RestaurantMeta> {
  try {
    return JSON.parse(localStorage.getItem(RESTAURANT_CACHE_KEY) ?? "{}");
  } catch {
    return {};
  }
}
