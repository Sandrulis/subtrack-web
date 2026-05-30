export function parseStarRating(raw: unknown): number {
  const n =
    typeof raw === "number"
      ? Math.trunc(raw)
      : Number.parseInt(String(raw ?? "0"), 10);
  if (!Number.isFinite(n)) return 0;
  return Math.min(5, Math.max(0, n));
}
