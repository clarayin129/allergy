"use client";

import { useState } from "react";
import { submitExperience, SubmitExperienceRequest, Experience } from "@/lib/api";

interface SubmitExperienceFormProps {
  placeId: string;
  restaurantName: string;
  allergies: string[];
  onSubmitted: (exp: Experience) => void;
}

const OUTCOMES: { value: SubmitExperienceRequest["outcome"]; label: string; desc: string }[] = [
  { value: "safe",     label: "I ate safely",      desc: "No reaction or issues" },
  { value: "cautious", label: "I was careful",      desc: "Managed it but had concerns" },
  { value: "reaction", label: "I had a reaction",   desc: "Allergic reaction occurred" },
];

export default function SubmitExperienceForm({
  placeId,
  restaurantName,
  allergies,
  onSubmitted,
}: SubmitExperienceFormProps) {
  const [outcome, setOutcome] = useState<SubmitExperienceRequest["outcome"] | "">("");
  const [dishName, setDishName] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!outcome) {
      setError("Please select an outcome.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const exp = await submitExperience({
        place_id: placeId,
        restaurant_name: restaurantName,
        dish_name: dishName.trim(),
        allergies,
        outcome,
        notes: notes.trim(),
      });
      onSubmitted(exp);
    } catch (e) {
      setError("Failed to submit. Please try again.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4 bg-gray-50 rounded-xl p-4 border border-gray-100">
      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700">How did it go?</p>
        <div className="space-y-2">
          {OUTCOMES.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => setOutcome(o.value)}
              className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${
                outcome === o.value
                  ? "border-green-500 bg-green-50"
                  : "border-gray-200 bg-white"
              }`}
            >
              <span className="font-medium text-gray-900">{o.label}</span>
              <span className="text-gray-500 ml-2">— {o.desc}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">
          Dish <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <input
          type="text"
          value={dishName}
          onChange={(e) => setDishName(e.target.value)}
          placeholder="e.g. Pad Thai, Green Curry"
          className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">
          Notes <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="What did you ask staff? What happened? Any details that could help others."
          className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
        />
      </div>

      <div className="flex flex-wrap gap-1">
        {allergies.map((a) => (
          <span key={a} className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
            {a}
          </span>
        ))}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full py-3 bg-green-600 text-white rounded-xl font-semibold text-sm disabled:opacity-50"
      >
        {loading ? "Submitting..." : "Submit report"}
      </button>
    </div>
  );
}
