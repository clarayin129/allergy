"use client";

import { DishRating } from "@/lib/api";

interface DishRatingListProps {
  ratings: DishRating[];
}

const RATING_CONFIG = {
  safe:    { label: "Safe",    className: "bg-green-100 text-green-800 border-green-200" },
  caution: { label: "Caution", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  avoid:   { label: "Avoid",   className: "bg-red-100 text-red-800 border-red-200" },
};

export default function DishRatingList({ ratings }: DishRatingListProps) {
  if (!ratings.length) return null;

  const sorted = [...ratings].sort((a, b) => {
    const order = { avoid: 0, caution: 1, safe: 2 };
    return (order[a.rating] ?? 1) - (order[b.rating] ?? 1);
  });

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold text-gray-700">Dish ratings</h2>
      <div className="divide-y divide-gray-100 rounded-xl border border-gray-100 overflow-hidden bg-white">
        {sorted.map((dish) => {
          const cfg = RATING_CONFIG[dish.rating] ?? RATING_CONFIG.caution;
          return (
            <div key={dish.name} className="flex items-start gap-3 px-4 py-3">
              <span className={`mt-0.5 shrink-0 inline-flex items-center border rounded-full px-2 py-0.5 text-xs font-medium ${cfg.className}`}>
                {cfg.label}
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium text-gray-900">{dish.name}</p>
                  {dish.from_report && (
                    <span className="text-xs text-gray-400">· from reports</span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{dish.reason}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
