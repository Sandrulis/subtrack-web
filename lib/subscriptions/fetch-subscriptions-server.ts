import { loadAuthContext } from "@/lib/auth/load-auth-context";
import type { SubscriptionClient, SubscriptionRow } from "./subscription-client";
import { mapSubscriptionRowToClient } from "./subscription-map";
export async function fetchSubscriptionsForSession(): Promise<
  SubscriptionClient[]
> {
  const { supabase, user } = await loadAuthContext();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .order("next_payment_date", { ascending: true });

  if (error || !data) {
    return [];
  }

  return (data as SubscriptionRow[]).map(mapSubscriptionRowToClient);
}
