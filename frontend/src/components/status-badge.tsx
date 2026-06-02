import { cn } from "@/lib/utils";

type StatusBadgeProps = {
  status: string;
};

const statusStyleMap: Record<string, string> = {
  processed: "bg-emerald-100 text-emerald-700 ring-emerald-200",
  failed: "bg-rose-100 text-rose-700 ring-rose-200",
  queued: "bg-amber-100 text-amber-700 ring-amber-200",
  uploading: "bg-blue-100 text-blue-700 ring-blue-200",
  ready: "bg-sky-100 text-sky-700 ring-sky-200",
  invalid: "bg-zinc-200 text-zinc-700 ring-zinc-300",
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const normalized = status.toLowerCase();
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize ring-1 ring-inset",
        statusStyleMap[normalized] ?? "bg-zinc-100 text-zinc-700 ring-zinc-200",
      )}
    >
      {normalized}
    </span>
  );
}

