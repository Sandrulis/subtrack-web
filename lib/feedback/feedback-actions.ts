"use server";

import { loadAuthContext } from "@/lib/auth/load-auth-context";
import { parseStarRating } from "@/lib/feedback/parse-star-rating";
import type { FeedbackRow } from "@/lib/feedback/types";
import { getUiPhraseForRequest } from "@/lib/ui/server-ui-phrases";

export type FeedbackActionResult = { ok: true } | { ok: false; message: string };

export type FetchFeedbackResult =
  | { ok: true; items: FeedbackRow[]; ownFeedback: FeedbackRow | null }
  | { ok: false; message: string };

export type FetchOwnFeedbackResult =
  | { ok: true; feedback: FeedbackRow | null }
  | { ok: false; message: string };

const BODY_MIN = 10;
const BODY_MAX = 1200;

function mapRow(
  raw: {
    id: string;
    user_id: string;
    body: string;
    star_rating: number | string;
    approved_for_landing: boolean;
    created_at: string;
    updated_at: string;
    author_display: string;
  },
  currentUserId: string,
): FeedbackRow {
  return {
    id: raw.id,
    userId: raw.user_id,
    body: raw.body,
    starRating: parseStarRating(raw.star_rating),
    approvedForLanding: raw.approved_for_landing === true,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
    authorDisplay: String(raw.author_display ?? "").trim() || "—",
    isOwn: raw.user_id === currentUserId,
  };
}

async function requireAuthedUserId(): Promise<
  | {
      ok: true;
      userId: string;
      supabase: Awaited<ReturnType<typeof loadAuthContext>>["supabase"];
    }
  | { ok: false; message: string }
> {
  const ctx = await loadAuthContext();
  if (ctx.authError || !ctx.user) {
    return {
      ok: false,
      message: await getUiPhraseForRequest("feedback.err_unauthorized"),
    };
  }
  return { ok: true, userId: ctx.user.id, supabase: ctx.supabase };
}

export async function fetchOwnFeedbackAction(): Promise<FetchOwnFeedbackResult> {
  const auth = await requireAuthedUserId();
  if (!auth.ok) return auth;

  const { data, error } = await auth.supabase
    .from("user_feedback")
    .select(
      "id, user_id, body, star_rating, approved_for_landing, created_at, updated_at",
    )
    .eq("user_id", auth.userId)
    .maybeSingle();

  if (error) {
    let msg = error.message;
    if (/user_feedback/i.test(msg) && /relation/i.test(msg)) {
      msg =
        "Migrācija `database/supabase/151_user_feedback.sql` vēl nav palaista.";
    } else if (/star_rating/i.test(msg) && /column/i.test(msg)) {
      msg =
        "Migrācija `database/supabase/152_user_feedback_star_rating.sql` vēl nav palaista.";
    }
    return { ok: false, message: msg };
  }

  if (!data) {
    return { ok: true, feedback: null };
  }

  const row = data as {
    id: string;
    user_id: string;
    body: string;
    star_rating: number | string;
    approved_for_landing: boolean;
    created_at: string;
    updated_at: string;
  };

  return {
    ok: true,
    feedback: mapRow(
      { ...row, author_display: "" },
      auth.userId,
    ),
  };
}

export async function fetchFeedbackAction(): Promise<FetchFeedbackResult> {
  const auth = await requireAuthedUserId();
  if (!auth.ok) return auth;

  const { data, error } = await auth.supabase.rpc("list_user_feedback");
  if (error) {
    let msg = error.message;
    if (/list_user_feedback/i.test(msg) && /function/i.test(msg)) {
      msg =
        "Migrācija `database/supabase/151_user_feedback.sql` vai `152_user_feedback_star_rating.sql` vēl nav palaista.";
    } else if (/star_rating/i.test(msg) && /column/i.test(msg)) {
      msg =
        "Migrācija `database/supabase/152_user_feedback_star_rating.sql` vēl nav palaista.";
    }
    return { ok: false, message: msg };
  }

  const rows = Array.isArray(data) ? data : [];
  const items = rows.map((r) =>
    mapRow(r as Parameters<typeof mapRow>[0], auth.userId),
  );
  const ownFeedback = items.find((i) => i.isOwn) ?? null;
  return { ok: true, items, ownFeedback };
}

export async function saveFeedbackAction(
  formData: FormData,
): Promise<FeedbackActionResult> {
  const auth = await requireAuthedUserId();
  if (!auth.ok) return auth;

  const body = String(formData.get("body") ?? "").trim();
  const starRaw = String(formData.get("star_rating") ?? "").trim();
  const starRating = Number.parseInt(starRaw, 10);

  if (!Number.isFinite(starRating) || starRating < 0 || starRating > 5) {
    return {
      ok: false,
      message: await getUiPhraseForRequest("feedback.err_rating_invalid"),
    };
  }
  if (starRating < 1) {
    return {
      ok: false,
      message: await getUiPhraseForRequest("feedback.err_rating_required"),
    };
  }
  if (body.length < BODY_MIN) {
    return {
      ok: false,
      message: await getUiPhraseForRequest("feedback.err_body_too_short"),
    };
  }
  if (body.length > BODY_MAX) {
    return {
      ok: false,
      message: await getUiPhraseForRequest("feedback.err_body_too_long"),
    };
  }

  const { data: existing } = await auth.supabase
    .from("user_feedback")
    .select("id")
    .eq("user_id", auth.userId)
    .maybeSingle();

  if (existing?.id) {
    const { error } = await auth.supabase
      .from("user_feedback")
      .update({ body, star_rating: starRating })
      .eq("id", existing.id)
      .eq("user_id", auth.userId);
    if (error) {
      return { ok: false, message: error.message };
    }
    return { ok: true };
  }

  const { error } = await auth.supabase.from("user_feedback").insert({
    user_id: auth.userId,
    body,
    star_rating: starRating,
  });

  if (error) {
    let msg = error.message;
    if (/user_feedback_user_id_unique/i.test(msg) || /duplicate key/i.test(msg)) {
      const { error: updErr } = await auth.supabase
        .from("user_feedback")
        .update({ body, star_rating: starRating })
        .eq("user_id", auth.userId);
      if (updErr) return { ok: false, message: updErr.message };
      return { ok: true };
    }
    if (/user_feedback/i.test(msg) && /relation/i.test(msg)) {
      msg =
        "Migrācija `database/supabase/151_user_feedback.sql` vēl nav palaista.";
    } else if (/star_rating/i.test(msg) && /column/i.test(msg)) {
      msg =
        "Migrācija `database/supabase/152_user_feedback_star_rating.sql` vēl nav palaista.";
    }
    return { ok: false, message: msg };
  }

  return { ok: true };
}
