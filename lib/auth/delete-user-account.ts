import type { SupabaseClient } from "@supabase/supabase-js";
import { cancelStripeBillingForDeletedUser } from "@/lib/auth/cancel-stripe-for-deleted-user";
import {
  loadSupportContactEmailForDeletionNotice,
  sendAccountDeletionNoticeEmail,
} from "@/lib/auth/send-account-deletion-notice-email";
import { purgeFamilySharingForDeletedUser } from "@/lib/auth/purge-family-sharing-for-deleted-user";
import { purgeUserStorageFiles } from "@/lib/auth/purge-user-storage";
import { loadEmailTemplatesStoreForSend } from "@/lib/emails/load-email-templates-store";
import {
  DISPLAY_PREFERENCES_DEFAULTS,
  mergeDisplayPreferences,
  sanitizeDisplayPreferencesPartial,
} from "@/lib/user-display-preferences";

function normalizeSignupEmail(email: string): string {
  return email.trim().toLowerCase();
}

export type DeleteUserAccountErrorCode =
  | "service_unavailable"
  | "not_found"
  | "failed";

export type DeleteUserAccountResult =
  | { ok: true }
  | { ok: false; code: DeleteUserAccountErrorCode };

type UserDeleteRow = {
  id: string;
  email: string | null;
  name?: string | null;
  surname?: string | null;
  display_preferences?: unknown;
  avatar_url?: string | null;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  pro_vip?: boolean | null;
};

export type DeleteUserAccountOptions = {
  /** Ja norādīts, nosūta uz atbalsta e-pastu pirms dzēšanas. */
  deletionReason?: string | null;
};

/**
 * Sagatavošana (Stripe, storage, ģimenes saites), tad dzēš auth lietotāju
 * (cascade uz public.users u.c.) un noņem e-pastu no retired_signup_emails.
 */
export async function deleteUserAccountById(
  service: SupabaseClient,
  userId: string,
  options: DeleteUserAccountOptions = {},
): Promise<DeleteUserAccountResult> {
  const { data: targetRow, error: targetErr } = await service
    .from("users")
    .select(
      "id, email, name, surname, display_preferences, avatar_url, stripe_customer_id, stripe_subscription_id, pro_vip",
    )
    .eq("id", userId)
    .maybeSingle();

  if (targetErr) {
    return { ok: false, code: "failed" };
  }

  if (!targetRow) {
    return { ok: false, code: "not_found" };
  }

  const row = targetRow as UserDeleteRow;
  const emailNorm = normalizeSignupEmail(String(row.email ?? ""));
  const reasonRaw =
    typeof options.deletionReason === "string" ? options.deletionReason.trim() : "";
  const deletionReason =
    reasonRaw.length > 4000 ? reasonRaw.slice(0, 4000) : reasonRaw;

  if (deletionReason && emailNorm.includes("@")) {
    const supportCfg = await loadSupportContactEmailForDeletionNotice();
    if (supportCfg) {
      const name = typeof row.name === "string" ? row.name.trim() : "";
      const surname = typeof row.surname === "string" ? row.surname.trim() : "";
      const displayName = [name, surname].filter(Boolean).join(" ") || emailNorm;
      const prefs = mergeDisplayPreferences(
        sanitizeDisplayPreferencesPartial(row.display_preferences),
        DISPLAY_PREFERENCES_DEFAULTS,
      );
      const tplBundle = await loadEmailTemplatesStoreForSend();
      await sendAccountDeletionNoticeEmail({
        supportTo: supportCfg.supportTo,
        replyTo: emailNorm,
        systemName: supportCfg.systemName,
        userId,
        userEmail: emailNorm,
        userDisplayName: displayName,
        deletionReason,
        locale: prefs.interface_language_code,
        templatesStore: tplBundle ?? undefined,
      });
    }
  }

  await cancelStripeBillingForDeletedUser(row);
  await purgeFamilySharingForDeletedUser(service, userId, emailNorm);
  await purgeUserStorageFiles(service, userId, row.avatar_url);

  const { error: deleteAuthErr } = await service.auth.admin.deleteUser(userId);

  if (deleteAuthErr) {
    const msg = (deleteAuthErr.message ?? "").trim().toLowerCase();
    if (msg.includes("not found") || msg.includes("user not found")) {
      return { ok: false, code: "not_found" };
    }
    return { ok: false, code: "failed" };
  }

  if (emailNorm.includes("@")) {
    await service
      .from("retired_signup_emails")
      .delete()
      .eq("email_normalized", emailNorm);
  }

  return { ok: true };
}
