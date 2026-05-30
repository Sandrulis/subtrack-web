import { unstable_cache } from "next/cache";
import type { LandingFeedbackRow } from "@/lib/feedback/types";
import { parseStarRating } from "@/lib/feedback/parse-star-rating";
import { createPublicAnonSupabaseClient } from "@/lib/supabase/public-anon-client";

async function fetchLandingFeedback(): Promise<LandingFeedbackRow[]> {
  const supabase = createPublicAnonSupabaseClient();
  if (!supabase) return [];
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
