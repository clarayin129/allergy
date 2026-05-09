"use client";

import Link from "next/link";
import { RestaurantSummary } from "@/lib/api";
import { saveRestaurantMeta } from "@/lib/storage";

interface RestaurantCardProps {
  restaurant: RestaurantSummary;
}

export default function RestaurantCard({ restaurant }: RestaurantCardProps) {
  const distanceLabel =
    restaurant.distance_meters < 1000
      ? `${Math.round(restaurant.distance_meters)}m`
      : `${(restaurant.distance_meters / 1000).toFixed(1)}km`;

  function handleClick() {
    saveRestaurantMeta({
      place_id: restaurant.place_id,
      name: restaurant.name,
      address: restaurant.address,
      cuisine: restaurant.cuisine,
    });
  }

  return (
    <Link href={`/restaurants/${restaurant.place_id}`} onClick={handleClick}>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-start gap-4 hover:shadow-md transition-shadow active:scale-[0.99]">
        <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center text-2xl shrink-0 overflow-hidden">
          {restaurant.photo_url ? (
            <img src={restaurant.photo_url} alt={restaurant.name} className="w-full h-full object-cover" />
          ) : (
            "🍽️"
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-gray-900 truncate">{restaurant.name}</h3>
            <span className={`text-xs shrink-0 font-medium ${restaurant.experience_count > 0 ? "text-green-700" : "text-gray-400"}`}>
              {restaurant.experience_count > 0
                ? `${restaurant.experience_count} report${restaurant.experience_count !== 1 ? "s" : ""}`
                : "No reports yet"}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            {restaurant.cuisine} · {distanceLabel}
            {restaurant.rating ? ` · ★ ${restaurant.rating}` : ""}
          </p>
          <p className="text-xs text-gray-400 mt-1 truncate">{restaurant.address}</p>
        </div>
      </div>
    </Link>
  );
}
