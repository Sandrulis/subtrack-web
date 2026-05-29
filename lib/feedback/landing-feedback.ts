import { createClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";
import type { LandingFeedbackRow } from "@/lib/feedback/types";

function parseStarRating(raw: unknown): number {
  const n =
    typeof raw === "number"
      ? Math.trunc(raw)
      : Number.parseInt(String(raw ?? "0"), 10);
  if (!Number.isFinite(n)) return 0;
  return Math.min(5, Math.max(0, n));
}

async function fetchLandingFeedback(): Promise<LandingFeedbackRow[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return [];

  const supabase = createClient(url, key);
  const { data, error } = await supabase.rpc("list_landing_feedback");
  if (error || !Array.isArray(data)) return [];

  return data.map((row) => {
    const r = row as {
      id: string;
      body: string;
      star_rating: number | string;
      author_display: string;
      created_at: string;
    };
    return {
      id: r.id,
      body: r.body,
      starRating: parseStarRating(r.star_rating),
      authorDisplay: String(r.author_display ?? "").trim() || "—",
      createdAt: r.created_at,
    };
  });
}

/**
 * Apstiprinātās atsauksmes sākumlapai (anon RPC + kešs).
 */
export async function getLandingFeedback(): Promise<LandingFeedbackRow[]> {
  return unstable_cache(fetchLandingFeedback, ["subtrack-landing-feedback-v2"], {
    revalidate: 300,
    tags: ["landing-feedback"],
  })();
}
