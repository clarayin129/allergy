interface SafetyBadgeProps {
  risk: "low" | "medium" | "high" | "SAFE" | "CAUTION" | "AVOID" | null | undefined;
  size?: "sm" | "md";
}

const CONFIG = {
  low: { label: "Safe", className: "bg-green-100 text-green-800 border-green-200" },
  SAFE: { label: "Safe", className: "bg-green-100 text-green-800 border-green-200" },
  medium: { label: "Caution", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  CAUTION: { label: "Caution", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  high: { label: "Avoid", className: "bg-red-100 text-red-800 border-red-200" },
  AVOID: { label: "Avoid", className: "bg-red-100 text-red-800 border-red-200" },
};

export default function SafetyBadge({ risk, size = "md" }: SafetyBadgeProps) {
  if (!risk) {
    return (
      <span className={`inline-flex items-center border rounded-full font-medium ${size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm"} bg-gray-100 text-gray-500 border-gray-200`}>
        Unknown
      </span>
    );
  }

  const config = CONFIG[risk] ?? CONFIG.medium;
  return (
    <span className={`inline-flex items-center border rounded-full font-medium ${size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm"} ${config.className}`}>
      {config.label}
    </span>
  );
}
