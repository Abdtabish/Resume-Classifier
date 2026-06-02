"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Download, Search, SlidersHorizontal } from "lucide-react";
import type { ResumeResult } from "@/lib/types";
import { StatusBadge } from "@/components/status-badge";

type ResultsSectionProps = {
  results: ResumeResult[];
};

type ViewMode = "cards" | "table";
type SortMode = "confidence-desc" | "confidence-asc" | "file-asc";

export function ResultsSection({ results }: ResultsSectionProps) {
  const [query, setQuery] = useState("");
  const [field, setField] = useState("ALL");
  const [sort, setSort] = useState<SortMode>("confidence-desc");
  const [view, setView] = useState<ViewMode>("cards");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const fields = useMemo(() => {
    const set = new Set<string>();
    for (const r of results) if (r.prediction) set.add(r.prediction);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [results]);

  const filtered = useMemo(() => {
    let list = [...results];
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((r) => r.fileName.toLowerCase().includes(q));
    }
    if (field !== "ALL") list = list.filter((r) => r.prediction === field);

    if (sort === "confidence-desc") list.sort((a, b) => b.confidence - a.confidence);
    else if (sort === "confidence-asc") list.sort((a, b) => a.confidence - b.confidence);
    else list.sort((a, b) => a.fileName.localeCompare(b.fileName));

    return list;
  }, [results, query, field, sort]);

  const exportCsv = () => {
    if (!filtered.length) return;
    const rows = [
      ["fileName", "prediction", "confidence", "status", "textPreview"],
      ...filtered.map((r) => [
        r.fileName,
        r.prediction,
        r.confidence.toFixed(2),
        r.status,
        (r.textPreview || "").replace(/\r?\n/g, " "),
      ]),
    ];
    const csv = rows
      .map((row) =>
        row
          .map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`)
          .join(","),
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "resume-classification-results.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-soft sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-600">
          Classification Results
        </h2>
        <button
          type="button"
          onClick={exportCsv}
          disabled={!filtered.length}
          className="inline-flex items-center rounded-lg bg-zinc-900 px-3 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Download className="mr-2 h-4 w-4" />
          Download CSV
        </button>
      </div>

      <div className="mt-4 grid gap-2 lg:grid-cols-4">
        <label className="relative lg:col-span-2">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by file name"
            className="w-full rounded-lg border border-zinc-300 bg-white py-2 pl-9 pr-3 text-sm outline-none ring-brand-300 focus:ring"
          />
        </label>

        <label className="relative">
          <SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <select
            value={field}
            onChange={(e) => setField(e.target.value)}
            className="w-full appearance-none rounded-lg border border-zinc-300 bg-white py-2 pl-9 pr-8 text-sm outline-none ring-brand-300 focus:ring"
          >
            <option value="ALL">All fields</option>
            {fields.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        </label>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortMode)}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-brand-300 focus:ring"
        >
          <option value="confidence-desc">Confidence: High to Low</option>
          <option value="confidence-asc">Confidence: Low to High</option>
          <option value="file-asc">File Name: A to Z</option>
        </select>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          className={`rounded-lg px-3 py-1.5 text-sm font-medium ${view === "cards" ? "bg-brand-600 text-white" : "bg-zinc-100 text-zinc-700"}`}
          onClick={() => setView("cards")}
        >
          Cards
        </button>
        <button
          type="button"
          className={`rounded-lg px-3 py-1.5 text-sm font-medium ${view === "table" ? "bg-brand-600 text-white" : "bg-zinc-100 text-zinc-700"}`}
          onClick={() => setView("table")}
        >
          Table
        </button>
      </div>

      {filtered.length === 0 ? (
        <p className="mt-5 rounded-xl border border-zinc-200 bg-zinc-50 p-6 text-sm text-zinc-500">
          No results match your current filters.
        </p>
      ) : view === "cards" ? (
        <ul className="mt-4 grid max-h-[32rem] gap-2 overflow-y-auto pr-1 xl:grid-cols-2">
          {filtered.map((r) => {
            const isOpen = Boolean(expanded[r.fileName]);
            const preview = r.textPreview || "No text preview available.";
            const compact = preview.length > 130 && !isOpen;
            return (
              <li key={r.fileName} className="rounded-lg border border-zinc-200 p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-zinc-900">{r.fileName}</p>
                    <p className="mt-1 text-sm text-zinc-600">
                      Prediction: <span className="font-medium">{r.prediction || "N/A"}</span>
                    </p>
                  </div>
                  <StatusBadge status={r.status} />
                </div>
                <p className="mt-2 text-sm text-zinc-700">
                  Confidence: <span className="font-semibold">{r.confidence.toFixed(2)}%</span>
                </p>
                <p className="mt-2 text-sm text-zinc-600">
                  {compact ? `${preview.slice(0, 130)}...` : preview}
                </p>
                {preview.length > 130 ? (
                  <button
                    type="button"
                    className="mt-2 text-sm font-medium text-brand-700 hover:text-brand-800"
                    onClick={() =>
                      setExpanded((prev) => ({ ...prev, [r.fileName]: !isOpen }))
                    }
                  >
                    {isOpen ? "Show less" : "Show full preview"}
                  </button>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="mt-5 overflow-x-auto rounded-xl border border-zinc-200">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead className="bg-zinc-50 text-zinc-600">
              <tr>
                <th className="px-3 py-2 font-semibold">File Name</th>
                <th className="px-3 py-2 font-semibold">Prediction</th>
                <th className="px-3 py-2 font-semibold">Confidence</th>
                <th className="px-3 py-2 font-semibold">Status</th>
                <th className="px-3 py-2 font-semibold">Preview</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.fileName} className="border-t border-zinc-200">
                  <td className="px-3 py-2 font-medium text-zinc-800">{r.fileName}</td>
                  <td className="px-3 py-2 text-zinc-700">{r.prediction}</td>
                  <td className="px-3 py-2 text-zinc-700">{r.confidence.toFixed(2)}%</td>
                  <td className="px-3 py-2">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="max-w-sm truncate px-3 py-2 text-zinc-600">
                    {r.textPreview || "No text preview available"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

