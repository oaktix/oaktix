import Link from "next/link";
import type { HealthSection, StatItem } from "@/lib/admin/health-sections";

interface Props {
  section: HealthSection & { stats: StatItem[] };
}

function StatusDot({ status }: { status?: StatItem["status"] }) {
  if (!status || status === "ok") return null;
  const colors = {
    warning: "bg-amber-400",
    alert: "bg-red-500",
  };
  return (
    <span className={`inline-block w-2 h-2 rounded-full ml-1.5 ${colors[status]} animate-pulse`} />
  );
}

export default function AdminHealthCard({ section }: Props) {
  const hasAlert = section.stats.some((s) => s.status === "alert");
  const hasWarning = !hasAlert && section.stats.some((s) => s.status === "warning");

  return (
    <Link
      href={section.href}
      className={`glass-card p-5 border transition-all hover:shadow-md hover:-translate-y-0.5 group block ${
        hasAlert
          ? "border-red-200 dark:border-red-900/40"
          : hasWarning
          ? "border-amber-200 dark:border-amber-900/40"
          : "border-[var(--color-muted)]"
      }`}
    >
      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-2xl">{section.icon}</span>
        {hasAlert && (
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800">
            Action Needed
          </span>
        )}
        {hasWarning && !hasAlert && (
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
            Attention
          </span>
        )}
      </div>

      <h3 className="font-bold text-sm text-zinc-900 dark:text-white mb-3 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
        {section.title}
      </h3>

      {/* Stats list */}
      <div className="space-y-2">
        {section.stats.map((stat, i) => (
          <div key={i} className="flex items-center justify-between text-xs">
            <span className="text-zinc-500 dark:text-zinc-400">{stat.label}</span>
            <span
              className={`font-bold ${
                stat.status === "alert"
                  ? "text-red-500"
                  : stat.status === "warning"
                  ? "text-amber-500"
                  : stat.status === "ok"
                  ? "text-emerald-500"
                  : "text-zinc-800 dark:text-zinc-200"
              }`}
            >
              {stat.value}
              <StatusDot status={stat.status} />
            </span>
          </div>
        ))}
      </div>

      {/* View section arrow */}
      <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end">
        <span className="text-[10px] text-zinc-400 group-hover:text-indigo-500 transition-colors font-bold uppercase tracking-wider">
          View section →
        </span>
      </div>
    </Link>
  );
}
