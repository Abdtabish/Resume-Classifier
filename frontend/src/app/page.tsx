"use client";

import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { classifyResumes } from "@/lib/api";
import type { ResumeResult, UploadItem } from "@/lib/types";
import { clamp, cn } from "@/lib/utils";
import { UploadDropzone } from "@/components/upload-dropzone";
import { UploadList } from "@/components/upload-list";
import { SummaryPanel } from "@/components/summary-panel";
import { ResultsSection } from "@/components/results-section";

function makeUploadId(file: File) {
  return `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`;
}

function isPdf(file: File) {
  return (
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
  );
}

export default function Page() {
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [results, setResults] = useState<ResumeResult[]>([]);
  const [isClassifying, setIsClassifying] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [batchError, setBatchError] = useState<string | null>(null);

  const validUploads = useMemo(
    () => uploads.filter((u) => u.status !== "invalid"),
    [uploads],
  );

  const progress = validUploads.length
    ? clamp((processedCount / validUploads.length) * 100, 0, 100)
    : 0;

  const hasResults = results.length > 0;

  const onAddFiles = (files: File[]) => {
    const next: UploadItem[] = files.map((f) => {
      if (!isPdf(f)) {
        return {
          id: makeUploadId(f),
          file: f,
          status: "invalid",
          error: "Invalid file type. Only PDF is allowed.",
        };
      }
      return {
        id: makeUploadId(f),
        file: f,
        status: "ready",
      };
    });

    setBatchError(null);
    setUploads((prev) => [...prev, ...next]);
  };

  const removeUpload = (id: string) => {
    setUploads((prev) => prev.filter((u) => u.id !== id));
  };

  const runClassification = async () => {
    if (!validUploads.length || isClassifying) return;

    setIsClassifying(true);
    setBatchError(null);
    setResults([]);
    setProcessedCount(0);
    setUploads((prev) =>
      prev.map((u) =>
        u.status === "invalid" ? u : { ...u, status: "uploading", error: undefined },
      ),
    );

    try {
      const files = validUploads.map((u) => u.file);
      const response = await classifyResumes(files);
      const resultMap = new Map(response.results.map((r) => [r.fileName, r]));

      const merged: ResumeResult[] = files.map((file, index) => {
        const match = resultMap.get(file.name);
        setProcessedCount(index + 1);
        if (!match) {
          return {
            fileName: file.name,
            prediction: "UNKNOWN",
            confidence: 0,
            textPreview: "",
            status: "failed",
            error: "No result returned by backend for this file.",
          };
        }
        return match;
      });

      setResults(merged);
      setUploads((prev) =>
        prev.map((u) => {
          if (u.status === "invalid") return u;
          const matched = merged.find((r) => r.fileName === u.file.name);
          if (!matched || matched.status.toLowerCase() === "failed") {
            return {
              ...u,
              status: "failed",
              error: matched?.error ?? "Classification failed",
            };
          }
          return { ...u, status: "processed", error: undefined };
        }),
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unexpected classification error";
      setBatchError(message);
      setUploads((prev) =>
        prev.map((u) =>
          u.status === "invalid"
            ? u
            : { ...u, status: "failed", error: "Batch request failed" },
        ),
      );
    } finally {
      setIsClassifying(false);
    }
  };

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-6 sm:px-6 lg:py-8">
      <header className="mb-5">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
          Resume Field Classifier
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm text-zinc-600 sm:text-base">
          Analyze one resume PDF or many PDFs from a folder. The model predicts the
          most likely job field such as ENGINEERING, SALES, HR, IT, and more.
        </p>
      </header>

      {/* Upload + files + classify — single workflow card */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-soft sm:p-5">
        <div
          className={cn(
            "grid gap-4",
            uploads.length > 0
              ? "lg:grid-cols-2 lg:items-stretch"
              : "grid-cols-1",
          )}
        >
          <UploadDropzone
            onAddFiles={onAddFiles}
            disabled={isClassifying}
            embedded={uploads.length > 0}
          />
          {uploads.length > 0 ? (
            <UploadList
              items={uploads}
              onRemove={removeUpload}
              disabled={isClassifying}
              embedded
            />
          ) : null}
        </div>

        <div className="mt-4 border-t border-zinc-100 pt-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-medium text-zinc-900">
                {validUploads.length === 0
                  ? "Upload at least one PDF to classify."
                  : isClassifying
                    ? `Processing ${processedCount} of ${validUploads.length} files…`
                    : `${validUploads.length} file(s) ready`}
              </p>
              {validUploads.length > 0 && !isClassifying ? (
                <p className="mt-0.5 text-xs text-zinc-500">
                  Review uploads above, then run classification.
                </p>
              ) : null}
            </div>

            <button
              type="button"
              onClick={runClassification}
              disabled={isClassifying || validUploads.length === 0}
              className="inline-flex min-h-10 w-full shrink-0 items-center justify-center rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500 sm:w-auto"
            >
              {isClassifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Classifying…
                </>
              ) : (
                "Classify Resumes"
              )}
            </button>
          </div>

          {(isClassifying || validUploads.length > 0) && (
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-100">
              <div
                className="h-full rounded-full bg-brand-600 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          {batchError ? (
            <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-sm text-rose-700">
              {batchError}
            </p>
          ) : null}
        </div>
      </section>

      {hasResults ? (
        <div className="mt-4 grid gap-4 lg:grid-cols-3 lg:items-start">
          <div className="lg:col-span-1">
            <SummaryPanel
              totalUploaded={uploads.length}
              totalProcessed={
                results.filter((r) => r.status.toLowerCase() === "processed").length
              }
              results={results}
            />
          </div>
          <div className="lg:col-span-2">
            <ResultsSection results={results} />
          </div>
        </div>
      ) : null}
    </main>
  );
}
