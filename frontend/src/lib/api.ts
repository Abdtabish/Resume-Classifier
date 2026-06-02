import { getClassifierApiUrl } from "@/lib/env";
import type { ClassifyResponse, ResumeResult } from "@/lib/types";

export class ApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function normalizeResult(r: ResumeResult): ResumeResult {
  const confidence =
    typeof r.confidence === "number" && Number.isFinite(r.confidence)
      ? r.confidence
      : 0;
  return {
    ...r,
    confidence,
    prediction: r.prediction ?? "",
    textPreview: r.textPreview ?? "",
    status: (r.status as string) ?? "processed",
  };
}

export async function classifyResumes(files: File[]): Promise<ClassifyResponse> {
  const baseUrl = getClassifierApiUrl();
  if (!baseUrl) {
    throw new ApiError(
      "Missing API URL. Set NEXT_PUBLIC_CLASSIFIER_API_URL in your frontend environment.",
    );
  }

  const form = new FormData();
  for (const f of files) form.append("files", f, f.name);

  const res = await fetch(`${baseUrl}/classify`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new ApiError(
      text || `API request failed with status ${res.status}`,
      res.status,
    );
  }

  const data = (await res.json()) as ClassifyResponse;
  return {
    results: Array.isArray(data?.results) ? data.results.map(normalizeResult) : [],
  };
}

