"use server";

import { revalidatePath } from "next/cache";
import { requireAdminUser } from "@/lib/auth/require-admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getUiPhraseForRequest } from "@/lib/ui/server-ui-phrases";

export type AdminUserMessagesActionResult =
  | { ok: true }
  | { ok: false; message: string };

const ADMIN_USER_MESSAGES_PATH = "/admin/user-messages";

function parseUuid(id: string): string | null {
  const trimmed = String(id ?? "").trim();
  return /^[0-9a-f-]{36}$/i.test(trimmed) ? trimmed : null;
}

async function afterMutation() {
  revalidatePath(ADMIN_USER_MESSAGES_PATH);
}

export async function deleteAdminSuggestionAction(
  suggestionId: string,
): Promise<AdminUserMessagesActionResult> {
  await requireAdminUser();
  const id = parseUuid(suggestionId);
  if (!id) {
    return {
      ok: false,
      message: await getUiPhraseForRequest("suggestions.err_invalid_id"),
    };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("user_suggestions").delete().eq("id", id);
  if (error) return { ok: false, message: error.message };

  await afterMutation();
  return { ok: true };
}

export async function deleteAdminFeedbackAction(
  feedbackId: string,
): Promise<AdminUserMessagesActionResult> {
  await requireAdminUser();
  const id = parseUuid(feedbackId);
  if (!id) {
    return {
      ok: false,
      message: await getUiPhraseForRequest("admin.user_messages.err_invalid_id"),
    };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("user_feedback").delete().eq("id", id);
  if (error) return { ok: false, message: error.message };

  await afterMutation();
  return { ok: true };
}

export async function setAdminFeedbackLandingAction(
  feedbackId: string,
  approved: boolean,
): Promise<AdminUserMessagesActionResult> {
  await requireAdminUser();
  const id = parseUuid(feedbackId);
  if (!id) {
    return {
      ok: false,
      message: await getUiPhraseForRequest("admin.user_messages.err_invalid_id"),
    };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("user_feedback")
    .update({ approved_for_landing: approved })
    .eq("id", id);
  if (error) return { ok: false, message: error.message };

  await afterMutation();
  return { ok: true };
}

export async function deleteAdminSupportRequestAction(
  requestId: string,
): Promise<AdminUserMessagesActionResult> {
  await requireAdminUser();
  const id = parseUuid(requestId);
  if (!id) {
    return {
      ok: false,
      message: await getUiPhraseForRequest("admin.user_messages.err_invalid_id"),
    };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("user_support_requests").delete().eq("id", id);
  if (error) return { ok: false, message: error.message };

  await afterMutation();
  return { ok: true };
}
