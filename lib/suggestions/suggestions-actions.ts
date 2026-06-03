"use server";

import { loadAuthContext } from "@/lib/auth/load-auth-context";
import { resolveSessionIsAdmin } from "@/lib/auth/is-admin";
import type { SuggestionRow } from "@/lib/suggestions/types";
import { getUiPhraseForRequest } from "@/lib/ui/server-ui-phrases";

export type SuggestionsActionResult = { ok: true } | { ok: false; message: string };

export type FetchSuggestionsResult =
  | { ok: true; items: SuggestionRow[]; viewerIsAdmin: boolean }
  | { ok: false; message: string };

const TITLE_MIN = 3;
const TITLE_MAX = 160;
const BODY_MIN = 10;
const BODY_MAX = 2000;

function mapRow(
  raw: {
    id: string;
    user_id: string;
    title: string;
    body: string;
    created_at: string;
    vote_count: number | string;
    viewer_voted: boolean;
    author_display: string;
  },
  currentUserId: string,
): SuggestionRow {
  const voteCountRaw = raw.vote_count;
  const voteCount =
    typeof voteCountRaw === "number"
      ? voteCountRaw
      : Number.parseInt(String(voteCountRaw), 10) || 0;
  return {
    id: raw.id,
    userId: raw.user_id,
    title: raw.title,
    body: raw.body,
    createdAt: raw.created_at,
    voteCount: Math.max(0, voteCount),
    viewerVoted: raw.viewer_voted === true,
    authorDisplay: String(raw.author_display ?? "").trim() || "—",
    isOwn: raw.user_id === currentUserId,
  };
}

async function requireAuthedUserId(): Promise<
  { ok: true; userId: string; supabase: Awaited<ReturnType<typeof loadAuthContext>>["supabase"] } | { ok: false; message: string }
> {
  const ctx = await loadAuthContext();
  if (ctx.authError || !ctx.user) {
    return {
      ok: false,
      message: await getUiPhraseForRequest("suggestions.err_unauthorized"),
    };
  }
  return { ok: true, userId: ctx.user.id, supabase: ctx.supabase };
}

async function requireAuthedAdmin(): Promise<
  | {
      ok: true;
      userId: string;
      supabase: Awaited<ReturnType<typeof loadAuthContext>>["supabase"];
    }
  | { ok: false; message: string }
> {
  const auth = await requireAuthedUserId();
  if (!auth.ok) return auth;

  const isAdmin = await resolveSessionIsAdmin(auth.supabase);
  if (!isAdmin) {
    return {
      ok: false,
      message: await getUiPhraseForRequest("suggestions.err_forbidden"),
    };
  }

  return auth;
}

export async function fetchSuggestionsAction(): Promise<FetchSuggestionsResult> {
  const auth = await requireAuthedUserId();
  if (!auth.ok) return auth;

  const { data, error } = await auth.supabase.rpc("list_user_suggestions");
  if (error) {
    let msg = error.message;
    if (/list_user_suggestions/i.test(msg) && /function/i.test(msg)) {
      msg =
        "Migrācija `database/supabase/150_user_suggestions.sql` vēl nav palaista.";
    }
    return { ok: false, message: msg };
  }

  const rows = Array.isArray(data) ? data : [];
  const viewerIsAdmin = await resolveSessionIsAdmin(auth.supabase);
  return {
    ok: true,
    viewerIsAdmin,
    items: rows.map((r) =>
      mapRow(
        r as {
          id: string;
          user_id: string;
          title: string;
          body: string;
          created_at: string;
          vote_count: number | string;
          viewer_voted: boolean;
          author_display: string;
        },
        auth.userId,
      ),
    ),
  };
}

export async function createSuggestionAction(
  formData: FormData,
): Promise<SuggestionsActionResult> {
  const auth = await requireAuthedUserId();
  if (!auth.ok) return auth;

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  if (title.length < TITLE_MIN) {
    return {
      ok: false,
      message: await getUiPhraseForRequest("suggestions.err_title_too_short"),
    };
  }
  if (title.length > TITLE_MAX) {
    return {
      ok: false,
      message: await getUiPhraseForRequest("suggestions.err_title_too_long"),
    };
  }
  if (body.length < BODY_MIN) {
    return {
      ok: false,
      message: await getUiPhraseForRequest("suggestions.err_body_too_short"),
    };
  }
  if (body.length > BODY_MAX) {
    return {
      ok: false,
      message: await getUiPhraseForRequest("suggestions.err_body_too_long"),
    };
  }

  const { error } = await auth.supabase.from("user_suggestions").insert({
    user_id: auth.userId,
    title,
    body,
  });

  if (error) {
    let msg = error.message;
    if (/user_suggestions/i.test(msg) && /relation/i.test(msg)) {
      msg =
        "Migrācija `database/supabase/150_user_suggestions.sql` vēl nav palaista.";
    }
    return { ok: false, message: msg };
  }

  return { ok: true };
}

export async function toggleSuggestionVoteAction(
  suggestionId: string,
): Promise<SuggestionsActionResult> {
  const auth = await requireAuthedUserId();
  if (!auth.ok) return auth;

  const id = String(suggestionId ?? "").trim();
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return {
      ok: false,
      message: await getUiPhraseForRequest("suggestions.err_invalid_id"),
    };
  }

  const { data: existing } = await auth.supabase
    .from("user_suggestion_votes")
    .select("suggestion_id")
    .eq("suggestion_id", id)
    .eq("user_id", auth.userId)
    .maybeSingle();

  if (existing) {
    const { error } = await auth.supabase
      .from("user_suggestion_votes")
      .delete()
      .eq("suggestion_id", id)
      .eq("user_id", auth.userId);
    if (error) return { ok: false, message: error.message };
    return { ok: true };
  }

  const { error } = await auth.supabase.from("user_suggestion_votes").insert({
    suggestion_id: id,
    user_id: auth.userId,
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true };
}

export async function deleteSuggestionAction(
  suggestionId: string,
): Promise<SuggestionsActionResult> {
  const auth = await requireAuthedAdmin();
  if (!auth.ok) return auth;

  const id = String(suggestionId ?? "").trim();
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return {
      ok: false,
      message: await getUiPhraseForRequest("suggestions.err_invalid_id"),
    };
  }

  const { error } = await auth.supabase
    .from("user_suggestions")
    .delete()
    .eq("id", id);

  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true };
}
