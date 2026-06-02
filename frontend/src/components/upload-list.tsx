import { FileText, Trash2 } from "lucide-react";
import { formatBytes } from "@/lib/utils";
import type { UploadItem } from "@/lib/types";
import { StatusBadge } from "@/components/status-badge";

type UploadListProps = {
  items: UploadItem[];
  onRemove: (id: string) => void;
  disabled?: boolean;
  embedded?: boolean;
};

export function UploadList({
  items,
  onRemove,
  disabled,
  embedded = false,
}: UploadListProps) {
  const listContent =
    items.length === 0 ? (
      <p className="rounded-lg border border-dashed border-zinc-200 bg-zinc-50 px-3 py-6 text-center text-sm text-zinc-500">
        No files uploaded yet.
      </p>
    ) : (
      <ul className="max-h-64 space-y-1 overflow-y-auto pr-1 sm:max-h-72">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-center gap-2 rounded-md border border-zinc-200 bg-zinc-50/80 px-2 py-1.5"
          >
            <FileText className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-zinc-800 sm:text-sm">
                {item.file.name}
              </p>
              <p className="truncate text-[11px] text-zinc-500">
                {formatBytes(item.file.size)}
                {item.error ? ` · ${item.error}` : ""}
              </p>
            </div>
            <StatusBadge status={item.status} />
            <button
              type="button"
              disabled={disabled}
              onClick={() => onRemove(item.id)}
              className="shrink-0 rounded p-1 text-zinc-500 hover:bg-zinc-200 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label={`Remove ${item.file.name}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </li>
        ))}
      </ul>
    );

  const header = (
    <div className="mb-2 flex items-center justify-between">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-600">
        Uploaded Files {items.length > 0 ? `(${items.length})` : ""}
      </h2>
    </div>
  );

  if (embedded) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        {header}
        <div className="min-h-0 flex-1">{listContent}</div>
      </div>
    );
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-soft sm:p-5">
      {header}
      {listContent}
    </section>
  );
}
