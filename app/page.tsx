"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAllergyProfile } from "@/hooks/useAllergyProfile";
import { useGeolocation } from "@/hooks/useGeolocation";
import { getNearbyRestaurants, RestaurantSummary } from "@/lib/api";
import RestaurantCard from "@/components/RestaurantCard";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function Home() {
  const router = useRouter();
  const { profile, loaded } = useAllergyProfile();
  const { coords, error: geoError, loading: geoLoading, request } = useGeolocation();

  const [restaurants, setRestaurants] = useState<RestaurantSummary[]>([]);
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (loaded && !profile) {
      router.replace("/onboarding");
    }
  }, [loaded, profile, router]);

  useEffect(() => {
    if (!coords) return;
    setFetching(true);
    setFetchError(null);
    getNearbyRestaurants(coords.lat, coords.lng)
      .then(setRestaurants)
      .catch((e) => setFetchError(e.message))
      .finally(() => setFetching(false));
  }, [coords]);

  if (!loaded) return null;

  const allergyList = profile?.must_avoid ?? [];

  return (
    <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">AllergyCheck</h1>
          {allergyList.length > 0 && (
            <p className="text-sm text-gray-500 mt-0.5">
              Avoiding: {allergyList.slice(0, 3).join(", ")}
              {allergyList.length > 3 ? ` +${allergyList.length - 3} more` : ""}
            </p>
          )}
        </div>
        <button
          onClick={() => router.push("/onboarding")}
          className="text-sm text-green-700 font-medium"
        >
          Edit profile
        </button>
      </div>

      {!coords && !geoLoading && (
        <button
          onClick={request}
          className="w-full py-3 bg-green-600 text-white rounded-xl font-medium text-sm"
        >
          Find restaurants near me
        </button>
      )}

      {geoLoading && <LoadingSpinner message="Getting your location..." />}
      {geoError && <p className="text-sm text-red-500">{geoError}</p>}

      {fetching && <LoadingSpinner message="Searching for restaurants..." />}
      {fetchError && <p className="text-sm text-red-500">{fetchError}</p>}

      {restaurants.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-gray-500">{restaurants.length} restaurants nearby</p>
          {restaurants.map((r) => (
            <RestaurantCard key={r.place_id} restaurant={r} />
          ))}
        </div>
      )}

      {coords && !fetching && restaurants.length === 0 && !fetchError && (
        <p className="text-sm text-gray-400 text-center py-8">No restaurants found nearby.</p>
      )}
    </main>
  );
}
