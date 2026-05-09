"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { analyzeRestaurant, RestaurantAnalysis } from "@/lib/api";
import { loadAllergyProfile, loadRestaurantMeta } from "@/lib/storage";
import SafetyBadge from "@/components/SafetyBadge";
import DishList from "@/components/DishList";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function RestaurantDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [analysis, setAnalysis] = useState<RestaurantAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const profile = loadAllergyProfile();
    if (!profile) {
      router.replace("/onboarding");
      return;
    }
    const meta = loadRestaurantMeta(id);
    analyzeRestaurant(id, profile, meta?.name, meta?.address, meta?.cuisine)
      .then(setAnalysis)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id, router]);

  return (
    <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
      <button onClick={() => router.back()} className="text-sm text-green-700 font-medium">
        ← Back
      </button>

      {loading && <LoadingSpinner message="Analyzing this restaurant for you..." />}

      {error && (
        <div className="space-y-2">
          <p className="text-sm text-red-500">{error}</p>
          <button
            onClick={() => router.back()}
            className="text-sm text-gray-500 underline"
          >
            Go back
          </button>
        </div>
      )}

      {analysis && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <SafetyBadge risk={analysis.overall_risk} />
            <p className="text-sm text-gray-600">{analysis.summary}</p>
          </div>

          {analysis.warnings.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 space-y-2">
              <p className="text-sm font-semibold text-yellow-800">Warnings</p>
              <ul className="space-y-1">
                {analysis.warnings.map((w, i) => (
                  <li key={i} className="text-xs text-yellow-700">
                    • {w}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <DishList dishes={analysis.dishes} />
        </div>
      )}
    </main>
  );
}
