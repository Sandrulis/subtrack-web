import { createServerSupabaseClient } from "@/lib/supabase/server";
import { normalizeProTrialConfig } from "@/lib/auth/pro-trial-access";
import { buildSessionBillingSummary } from "@/lib/billing/session-billing-summary";
import type { SessionBillingSummary } from "@/lib/billing/session-billing-summary";
import { fetchSystemPaidPlanLiveForDashboard } from "@/lib/subscriptions/dashboard-free-tier-gate";

export async function loadSessionBillingSummary(
  userId: string,
): Promise<SessionBillingSummary | null> {
  const supabase = await createServerSupabaseClient();
  const paid = await fetchSystemPaidPlanLiveForDashboard();

  const { data: row, error } = await supabase
    .from("users")
    .select(
      "paid_plan_active, pro_vip, pro_trial_used, pro_trial_started_at, paid_plan_type, paid_plan_period_end_at, paid_plan_auto_renew, stripe_customer_id",
    )
    .eq("id", userId)
    .maybeSingle();

  if (error || !row) return null;

  const { data: sysTrial } = await supabase
    .from("system_settings")
    .select("pro_trial_enabled, pro_trial_days")
    .eq("id", 1)
    .maybeSingle();

  const trialConfig = normalizeProTrialConfig(sysTrial);
  return buildSessionBillingSummary(paid.enabled, row, trialConfig);
}
