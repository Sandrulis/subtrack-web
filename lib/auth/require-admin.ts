import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { resolveSessionIsAdmin } from "@/lib/auth/is-admin";

/**
 * Aizsargā /admin maršrutus: tikai public.users.is_admin > 0.
 */
export async function requireAdminUser() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const isAdmin = await resolveSessionIsAdmin(supabase);

  if (!isAdmin) {
    redirect("/dashboard");
  }

  return user;
}
