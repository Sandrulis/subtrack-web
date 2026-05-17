import { redirect } from "next/navigation";
import { loadAuthContext } from "@/lib/auth/load-auth-context";
import { resolveSessionIsAdmin } from "@/lib/auth/is-admin";

/**
 * Aizsargā /admin maršrutus: tikai public.users.is_admin > 0.
 */
export async function requireAdminUser() {
  const { supabase, user } = await loadAuthContext();

  if (!user) {
    redirect("/");
  }

  const isAdmin = await resolveSessionIsAdmin(supabase);

  if (!isAdmin) {
    redirect("/dashboard");
  }

  return user;
}
