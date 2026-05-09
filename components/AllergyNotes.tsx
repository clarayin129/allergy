"use client";

interface AllergyNotesProps {
  value: string;
  onChange: (val: string) => void;
}

export default function AllergyNotes({ value, onChange }: AllergyNotesProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Additional notes <span className="text-gray-400 font-normal">(optional)</span>
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        placeholder="e.g. I can tolerate small amounts of egg but not baked egg. Cross contamination is very dangerous for me. Refined peanut oil is okay."
        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
      />
      <p className="text-xs text-gray-400">
        Our AI reads these notes to give you personalized recommendations.
      </p>
    </div>
  );
}
