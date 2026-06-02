import type { SupabaseClient } from "@supabase/supabase-js";

function normalizeInviteEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Noņem visas ģimenes dalīšanas saites, kas saistītas ar dzēšamo lietotāju:
 * viņa nosūtītie uzaicinājumi, saites kā partnerim, pending uzaicinājumi uz viņa e-pastu.
 */
export async function purgeFamilySharingForDeletedUser(
  service: SupabaseClient,
  userId: string,
  emailRaw: string,
): Promise<void> {
  const emailNorm = normalizeInviteEmail(emailRaw);

  await service.from("family_sharing_links").delete().eq("owner_user_id", userId);
  await service.from("family_sharing_links").delete().eq("partner_user_id", userId);

  if (emailNorm.includes("@")) {
    await service.from("family_sharing_links").delete().eq("invite_email", emailNorm);
  }
}
