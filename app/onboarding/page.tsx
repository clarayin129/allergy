"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AllergySelector from "@/components/AllergySelector";
import AllergyNotes from "@/components/AllergyNotes";
import LoadingSpinner from "@/components/LoadingSpinner";
import { interpretAllergy } from "@/lib/api";
import { saveAllergyProfile, saveRawInput } from "@/lib/storage";
import { useAllergyProfile } from "@/hooks/useAllergyProfile";

export default function Onboarding() {
  const router = useRouter();
  const { profile } = useAllergyProfile();

  const [allergies, setAllergies] = useState<string[]>(profile?.must_avoid ?? []);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (allergies.length === 0 && !notes.trim()) {
      setError("Please select at least one allergy or add a note.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const structured = await interpretAllergy(allergies, notes);
      saveAllergyProfile(structured);
      saveRawInput({ allergies, notes });
      router.replace("/");
    } catch (e) {
      setError("Failed to process your allergies. Please try again.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-lg mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Your allergy profile</h1>
        <p className="text-sm text-gray-500 mt-1">
          We use this to find safe restaurants and dishes for you.
        </p>
      </div>

      <AllergySelector selected={allergies} onChange={setAllergies} />
      <AllergyNotes value={notes} onChange={setNotes} />

      {error && <p className="text-sm text-red-500">{error}</p>}

      {loading ? (
        <LoadingSpinner message="Building your allergy profile..." />
      ) : (
        <button
          onClick={handleSubmit}
          className="w-full py-3 bg-green-600 text-white rounded-xl font-semibold text-sm"
        >
          {profile ? "Update profile" : "Get started"}
        </button>
      )}
    </main>
  );
}
