"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getExperiences, ExperiencesResponse, Experience } from "@/lib/api";
import { loadAllergyProfile, loadRestaurantMeta } from "@/lib/storage";
import ExperienceFeed from "@/components/ExperienceFeed";
import SubmitExperienceForm from "@/components/SubmitExperienceForm";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function RestaurantDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [data, setData] = useState<ExperiencesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const profile = loadAllergyProfile();
  const meta = loadRestaurantMeta(id);
  const allergies = profile?.must_avoid ?? [];

  useEffect(() => {
    if (!profile) {
      router.replace("/onboarding");
      return;
    }
    getExperiences(id, allergies)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function handleNewExperience(exp: Experience) {
    setShowForm(false);
    setData((prev) => {
      if (!prev) return prev;
      const newExperiences = [exp, ...prev.experiences];
      return {
        ...prev,
        experiences: newExperiences,
        summary: {
          ...prev.summary,
          total: prev.summary.total + 1,
          safe_count: prev.summary.safe_count + (exp.outcome === "safe" ? 1 : 0),
          reaction_count: prev.summary.reaction_count + (exp.outcome === "reaction" ? 1 : 0),
          cautious_count: prev.summary.cautious_count + (exp.outcome === "cautious" ? 1 : 0),
        },
      };
    });
  }

  return (
    <main className="max-w-lg mx-auto px-4 py-6 space-y-5">
      <button onClick={() => router.back()} className="text-sm text-green-700 font-medium">
        ← Back
      </button>

      {meta && (
        <div>
          <h1 className="text-lg font-bold text-gray-900">{meta.name}</h1>
          <p className="text-sm text-gray-500">{meta.cuisine} · {meta.address}</p>
        </div>
      )}

      <p className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
        These are user-reported experiences, not medical advice. Always inform your server of your allergies.
      </p>

      {loading && <LoadingSpinner message="Loading community reports..." />}
      {error && <p className="text-sm text-red-500">{error}</p>}

      {data && (
        <>
          {data.summary.ai_insight && (
            <p className="text-sm text-gray-700">{data.summary.ai_insight}</p>
          )}

          {data.summary.total > 0 && (
            <div className="flex gap-3 text-sm">
              {data.summary.safe_count > 0 && (
                <span className="text-green-700 font-medium">{data.summary.safe_count} safe</span>
              )}
              {data.summary.cautious_count > 0 && (
                <span className="text-yellow-700 font-medium">{data.summary.cautious_count} cautious</span>
              )}
              {data.summary.reaction_count > 0 && (
                <span className="text-red-700 font-medium">{data.summary.reaction_count} reaction{data.summary.reaction_count > 1 ? "s" : ""}</span>
              )}
            </div>
          )}

          <ExperienceFeed experiences={data.experiences} />

          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="w-full py-3 border border-green-600 text-green-700 rounded-xl font-semibold text-sm"
            >
              Share your experience
            </button>
          ) : (
            <SubmitExperienceForm
              placeId={id}
              restaurantName={meta?.name ?? id}
              allergies={allergies}
              onSubmitted={handleNewExperience}
            />
          )}
        </>
      )}
    </main>
  );
}
