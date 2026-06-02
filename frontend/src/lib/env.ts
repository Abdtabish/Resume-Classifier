export function getClassifierApiUrl(): string {
  const url =
    process.env.NEXT_PUBLIC_CLASSIFIER_API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "";
  return url.trim().replace(/\/+$/, "");
}

