import type { SupabaseClient } from "@supabase/supabase-js";
import type { PaidPlanType } from "@/lib/billing/paid-plan-type";

export type UserBillingStripePatch = {
  paid_plan_active: boolean;
  paid_plan_type: PaidPlanType | null;
  paid_plan_period_end_at: string | null;
  paid_plan_auto_renew: boolean;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
};

export async function applyUserBillingStripePatch(
  supabase: SupabaseClient,
  userId: string,
  patch: UserBillingStripePatch,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const row: Record<string, unknown> = {
    paid_plan_active: patch.paid_plan_active,
    paid_plan_type: patch.paid_plan_type,
    paid_plan_period_end_at: patch.paid_plan_period_end_at,
    paid_plan_auto_renew: patch.paid_plan_auto_renew,
  };
  if (patch.stripe_customer_id !== undefined) {
    row.stripe_customer_id = patch.stripe_customer_id;
  }
  if (patch.stripe_subscription_id !== undefined) {
    row.stripe_subscription_id = patch.stripe_subscription_id;
  }

  const { error } = await supabase.from("users").update(row).eq("id", userId);
  if (error) {
    return { ok: false, message: error.message };
  }
  return { ok: true };
}

export async function incrementLifetimePurchaseCount(
  supabase: SupabaseClient,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const { data, error: readErr } = await supabase
    .from("system_settings")
    .select("paid_plan_lifetime_purchase_count")
    .eq("id", 1)
    .maybeSingle();

  if (readErr) {
    return { ok: false, message: readErr.message };
  }

  const raw = (data as { paid_plan_lifetime_purchase_count?: unknown } | null)
    ?.paid_plan_lifetime_purchase_count;
  const current =
    typeof raw === "number"
      ? Math.trunc(raw)
      : typeof raw === "string"
        ? Number.parseInt(raw, 10) || 0
        : 0;

  const { error: updErr } = await supabase
    .from("system_settings")
    .update({ paid_plan_lifetime_purchase_count: current + 1 })
    .eq("id", 1);

  if (updErr) {
    return { ok: false, message: updErr.message };
  }
  return { ok: true };
}
