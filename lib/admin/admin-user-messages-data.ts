import { cache } from "react";
import { requireAdminUser } from "@/lib/auth/require-admin";
import { parseStarRating } from "@/lib/feedback/parse-star-rating";
import type {
  AdminFeedbackRow,
  AdminSuggestionRow,
  AdminSupportRequestRow,
} from "@/lib/admin/admin-user-messages-types";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type AdminUserMessagesPageData = {
  suggestions: AdminSuggestionRow[];
  feedback: AdminFeedbackRow[];
  supportRequests: AdminSupportRequestRow[];
  loadError: string | null;
};

function migrationHint(message: string): string {
  if (/list_admin_user_support_requests/i.test(message) && /function/i.test(message)) {
    return "Migrācija `database/supabase/174_user_support_requests.sql` vēl nav palaista.";
  }
  if (/user_support_requests/i.test(message) && /relation/i.test(message)) {
    return "Migrācija `database/supabase/174_user_support_requests.sql` vēl nav palaista.";
  }
  return message;
}

function mapSuggestion(raw: Record<string, unknown>): AdminSuggestionRow | null {
  const id = typeof raw.id === "string" ? raw.id : "";
  if (!id) return null;
  const voteRaw = raw.vote_count;
  const voteCount =
    typeof voteRaw === "number"
      ? voteRaw
      : Number.parseInt(String(voteRaw ?? "0"), 10) || 0;
  return {
    id,
    userId: String(raw.user_id ?? ""),
    title: String(raw.title ?? "").trim(),
    body: String(raw.body ?? ""),
    createdAt: String(raw.created_at ?? ""),
    voteCount: Math.max(0, voteCount),
    authorDisplay: String(raw.author_display ?? "").trim() || "—",
    authorEmail: String(raw.author_email ?? "").trim(),
  };
}

function mapFeedback(raw: Record<string, unknown>): AdminFeedbackRow | null {
  const id = typeof raw.id === "string" ? raw.id : "";
  if (!id) return null;
  return {
    id,
    userId: String(raw.user_id ?? ""),
    body: String(raw.body ?? ""),
    starRating: parseStarRating(raw.star_rating),
    approvedForLanding: raw.approved_for_landing === true,
    createdAt: String(raw.created_at ?? ""),
    updatedAt: String(raw.updated_at ?? ""),
    authorDisplay: String(raw.author_display ?? "").trim() || "—",
    authorEmail: String(raw.author_email ?? "").trim(),
  };
}

function mapSupport(raw: Record<string, unknown>): AdminSupportRequestRow | null {
  const id = typeof raw.id === "string" ? raw.id : "";
  if (!id) return null;
  return {
    id,
    userId: String(raw.user_id ?? ""),
    message: String(raw.message ?? ""),
    emailSent: raw.email_sent === true,
    createdAt: String(raw.created_at ?? ""),
    authorDisplay: String(raw.author_display ?? "").trim() || "—",
    authorEmail: String(raw.author_email ?? "").trim(),
  };
}

export const loadAdminUserMessagesPageData = cache(
  async (): Promise<AdminUserMessagesPageData> => {
    await requireAdminUser();
    const supabase = await createServerSupabaseClient();

    const [suggestionsRes, feedbackRes, supportRes] = await Promise.all([
      supabase.rpc("list_admin_user_suggestions"),
      supabase.rpc("list_admin_user_feedback"),
      supabase.rpc("list_admin_user_support_requests"),
    ]);

    const firstError =
      suggestionsRes.error ?? feedbackRes.error ?? supportRes.error;
    if (firstError) {
      return {
        suggestions: [],
        feedback: [],
        supportRequests: [],
        loadError: migrationHint(firstError.message),
      };
    }

    const suggestions = (Array.isArray(suggestionsRes.data) ? suggestionsRes.data : [])
      .map((row) => mapSuggestion(row as Record<string, unknown>))
      .filter((row): row is AdminSuggestionRow => row != null);

    const feedback = (Array.isArray(feedbackRes.data) ? feedbackRes.data : [])
      .map((row) => mapFeedback(row as Record<string, unknown>))
      .filter((row): row is AdminFeedbackRow => row != null);

    const supportRequests = (Array.isArray(supportRes.data) ? supportRes.data : [])
      .map((row) => mapSupport(row as Record<string, unknown>))
      .filter((row): row is AdminSupportRequestRow => row != null);

    return {
      suggestions,
      feedback,
      supportRequests,
      loadError: null,
    };
  },
);
