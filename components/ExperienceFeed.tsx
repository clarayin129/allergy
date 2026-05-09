import { Experience } from "@/lib/api";
import SafetyBadge from "./SafetyBadge";

interface ExperienceFeedProps {
  experiences: Experience[];
}

const ORDER: Experience["outcome"][] = ["reaction", "cautious", "safe"];

function relativeTime(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return `${months} month${months > 1 ? "s" : ""} ago`;
}

export default function ExperienceFeed({ experiences }: ExperienceFeedProps) {
  if (!experiences.length) {
    return (
      <p className="text-sm text-gray-400 text-center py-8">
        No reports yet. Be the first to share your experience here.
      </p>
    );
  }

  const sorted = [...experiences].sort(
    (a, b) => ORDER.indexOf(a.outcome) - ORDER.indexOf(b.outcome)
  );

  return (
    <div className="space-y-3">
      {sorted.map((exp) => (
        <div key={exp.id} className="bg-white rounded-xl border border-gray-100 p-4 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <SafetyBadge risk={exp.outcome} size="sm" />
            <span className="text-xs text-gray-400">{relativeTime(exp.created_at)}</span>
          </div>
          {exp.dish_name && (
            <p className="text-sm font-medium text-gray-800">{exp.dish_name}</p>
          )}
          {exp.notes && (
            <p className="text-sm text-gray-600">{exp.notes}</p>
          )}
          <div className="flex flex-wrap gap-1">
            {exp.allergies.map((a) => (
              <span key={a} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                {a}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
