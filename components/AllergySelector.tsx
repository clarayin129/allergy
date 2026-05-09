"use client";

const ALLERGENS = [
  { id: "peanuts", label: "Peanuts", emoji: "🥜" },
  { id: "tree_nuts", label: "Tree Nuts", emoji: "🌰" },
  { id: "dairy", label: "Dairy", emoji: "🥛" },
  { id: "gluten", label: "Gluten", emoji: "🌾" },
  { id: "shellfish", label: "Shellfish", emoji: "🦐" },
  { id: "fish", label: "Fish", emoji: "🐟" },
  { id: "eggs", label: "Eggs", emoji: "🥚" },
  { id: "soy", label: "Soy", emoji: "🫘" },
  { id: "sesame", label: "Sesame", emoji: "🌱" },
];

interface AllergySelectorProps {
  selected: string[];
  onChange: (selected: string[]) => void;
}

export default function AllergySelector({ selected, onChange }: AllergySelectorProps) {
  function toggle(id: string) {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else {
      onChange([...selected, id]);
    }
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Select your allergies
      </label>
      <div className="flex flex-wrap gap-2">
        {ALLERGENS.map((a) => {
          const active = selected.includes(a.id);
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => toggle(a.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-full border text-sm font-medium transition-all ${
                active
                  ? "bg-green-600 border-green-600 text-white shadow-sm"
                  : "bg-white border-gray-200 text-gray-600 hover:border-green-400"
              }`}
            >
              <span>{a.emoji}</span>
              <span>{a.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
