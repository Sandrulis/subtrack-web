/**
 * H2 smoke: ar anon atslēgu un pierakstu mēģina mainīt tikai `is_admin` savā `public.users` rindā.
 *
 * .env.local vai CI: NEXT_PUBLIC_SUPABASE_*, SECURITY_SMOKE_EMAIL, SECURITY_SMOKE_PASSWORD
 * Ja SECURITY_SMOKE_EMAIL nav, izlaiž (exit 0).
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
const email = process.env.SECURITY_SMOKE_EMAIL?.trim();
const password = process.env.SECURITY_SMOKE_PASSWORD ?? "";

async function main() {
  if (!email) {
    console.log("[security-smoke-users-rls] Bez SECURITY_SMOKE_EMAIL - izlaists.");
    process.exit(0);
  }
  if (!url || !anon) {
    console.error("[security-smoke-users-rls] Trūkst NEXT_PUBLIC_SUPABASE_URL vai ANON_KEY.");
    process.exit(1);
  }
  if (!password) {
    console.error("[security-smoke-users-rls] Trūkst SECURITY_SMOKE_PASSWORD.");
    process.exit(1);
  }

  const supabase = createClient(url, anon);
  const { error: signErr } = await supabase.auth.signInWithPassword({ email, password });
  if (signErr) {
    console.error("[security-smoke-users-rls] Pieslēgšanās:", signErr.message);
    process.exit(1);
  }

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) {
    console.error("[security-smoke-users-rls] Nav sesijas:", userErr?.message ?? "bez lietotāja");
    process.exit(1);
  }

  const { data: beforeRow, error: readErr } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();
  if (readErr) {
    console.error("[security-smoke-users-rls] Neizdevās nolasīt profilu:", readErr.message);
    process.exit(1);
  }

  const prevNum = Number(beforeRow?.is_admin ?? 0);
  const rogue = prevNum === 777 ? 776 : 777;

  const { error: updErr } = await supabase
    .from("users")
    .update({ is_admin: rogue })
    .eq("id", user.id);

  const { data: afterRow, error: afterErr } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();
  if (afterErr) {
    console.error("[security-smoke-users-rls] Pārbaudes lasīšana:", afterErr.message);
    process.exit(1);
  }

  const afterNum = Number(afterRow?.is_admin ?? prevNum);

  if (updErr) {
    console.log("[security-smoke-users-rls] OK - UPDATE noraidīts:", updErr.code ?? updErr.message);
    await supabase.auth.signOut();
    process.exit(0);
  }

  if (afterNum === rogue) {
    console.error(
      "[security-smoke-users-rls] KĻŪDA: `is_admin` izdevās izmainīt. Pārbaudi `015_users_rls_protect_privileged_columns.sql`.",
      { prevNum, rogue, afterNum },
    );
    await supabase.auth.signOut();
    process.exit(1);
  }

  console.log("[security-smoke-users-rls] OK - is_admin palika " + afterNum + ", mēģinājums " + rogue + ".");
  await supabase.auth.signOut();
  process.exit(0);
}

await main();
