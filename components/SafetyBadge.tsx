type Risk = "low" | "medium" | "high" | "safe" | "cautious" | "reaction" | null | undefined;

interface SafetyBadgeProps {
  risk: Risk;
  size?: "sm" | "md";
}

const CONFIG: Record<string, { label: string; className: string }> = {
  low:      { label: "Safe",              className: "bg-green-100 text-green-800 border-green-200" },
  safe:     { label: "Ate safely",        className: "bg-green-100 text-green-800 border-green-200" },
  medium:   { label: "Caution",           className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  cautious: { label: "Used caution",      className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  high:     { label: "Avoid",             className: "bg-red-100 text-red-800 border-red-200" },
  reaction: { label: "Reaction reported", className: "bg-red-100 text-red-800 border-red-200" },
};

export default function SafetyBadge({ risk, size = "md" }: SafetyBadgeProps) {
  const sizeClass = size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm";

  if (!risk || !CONFIG[risk]) {
    return (
      <span className={`inline-flex items-center border rounded-full font-medium ${sizeClass} bg-gray-100 text-gray-500 border-gray-200`}>
        Unknown
      </span>
    );
  }

  const { label, className } = CONFIG[risk];
  return (
    <span className={`inline-flex items-center border rounded-full font-medium ${sizeClass} ${className}`}>
      {label}
    </span>
  );
}
