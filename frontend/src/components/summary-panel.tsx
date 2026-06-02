import { BarChart3, CheckCircle2, Files, Sparkles } from "lucide-react";
import type { ResumeResult } from "@/lib/types";

type SummaryPanelProps = {
  totalUploaded: number;
  totalProcessed: number;
  results: ResumeResult[];
};

export function SummaryPanel({
  totalUploaded,
  totalProcessed,
  results,
}: SummaryPanelProps) {
  const processed = results.filter((r) => r.status.toLowerCase() === "processed");
  const highest = processed.reduce<ResumeResult | null>((acc, cur) => {
    if (!acc || cur.confidence > acc.confidence) return cur;
    return acc;
  }, null);

  const distribution = processed.reduce<Record<string, number>>((acc, cur) => {
    const key = cur.prediction || "UNKNOWN";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  const distributionEntries = Object.entries(distribution).sort((a, b) => b[1] - a[1]);

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-soft sm:p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-600">
        Batch Summary
      </h2>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <CardStat label="Total Uploaded" value={String(totalUploaded)} icon={Files} />
        <CardStat
          label="Total Processed"
          value={String(totalProcessed)}
          icon={CheckCircle2}
        />
        <CardStat
          label="Highest Confidence"
          value={
            highest
              ? `${highest.prediction} (${highest.confidence.toFixed(2)}%)`
              : "N/A"
          }
          icon={Sparkles}
        />
        <CardStat
          label="Predicted Fields"
          value={distributionEntries.length ? String(distributionEntries.length) : "0"}
          icon={BarChart3}
        />
      </div>

      <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Field Distribution
        </p>
        {distributionEntries.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500">No processed results yet.</p>
        ) : (
          <div className="mt-2 flex flex-wrap gap-2">
            {distributionEntries.map(([field, count]) => (
              <span
                key={field}
                className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-medium text-zinc-700 ring-1 ring-zinc-200"
              >
                {field}: {count}
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function CardStat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          {label}
        </p>
        <Icon className="h-4 w-4 text-zinc-500" />
      </div>
      <p className="mt-2 text-sm font-semibold text-zinc-900">{value}</p>
    </div>
  );
}

