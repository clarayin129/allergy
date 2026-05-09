import { Dish } from "@/lib/api";
import SafetyBadge from "./SafetyBadge";

interface DishListProps {
  dishes: Dish[];
}

const ORDER: Dish["classification"][] = ["SAFE", "CAUTION", "AVOID"];
const SECTION_LABELS: Record<Dish["classification"], string> = {
  SAFE: "Safe to order",
  CAUTION: "Order with caution",
  AVOID: "Avoid",
};

export default function DishList({ dishes }: DishListProps) {
  const grouped = ORDER.reduce<Record<string, Dish[]>>((acc, cls) => {
    acc[cls] = dishes.filter((d) => d.classification === cls);
    return acc;
  }, {} as Record<string, Dish[]>);

  return (
    <div className="space-y-6">
      {ORDER.map((cls) => {
        const group = grouped[cls];
        if (!group.length) return null;
        return (
          <div key={cls}>
            <div className="flex items-center gap-2 mb-3">
              <SafetyBadge risk={cls} size="sm" />
              <span className="text-sm font-medium text-gray-600">
                {SECTION_LABELS[cls]} ({group.length})
              </span>
            </div>
            <div className="space-y-2">
              {group.map((dish, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl border border-gray-100 p-3 flex items-start gap-3"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{dish.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{dish.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
