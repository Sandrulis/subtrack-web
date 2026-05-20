import { loadAuthContext } from "@/lib/auth/load-auth-context";
import { fetchPaidCalendarDayCounts } from "./subscription-payment";

export async function fetchPaidCalendarDaysForSession(): Promise<
  Record<string, number>
> {
  const { supabase, user } = await loadAuthContext();
  if (!user) {
    return {};
  }
  return fetchPaidCalendarDayCounts(supabase, user.id);
}
