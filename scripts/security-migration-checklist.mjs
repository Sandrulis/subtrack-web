/**
 * H1: obligāto drošības migrāciju saraksts jaunām Supabase vidēm.
 * Izvade - SQL failu secība (pārējie 017+ pēc vajadzības atsevišķi README).
 */
const CRITICAL = [
  "001_initial_schema.sql",
  "015_users_rls_protect_privileged_columns.sql",
  "016_sync_public_users_email_from_auth.sql",
  "022_security_advisor_hardening.sql",
  "023_security_advisor_rpcs.sql",
  "043_users_pro_vip.sql",
  "078_system_settings_email_templates_split.sql",
  "079_email_reminder_log_rls_policies.sql",
  "080_security_advisor_warnings.sql",
];

console.log("SubTrack - obligātās drošības migrācijas (H1):\n");
for (const f of CRITICAL) {
  console.log(`  database/supabase/${f}`);
}
console.log(
  "\nPēc 078: npm run security:smoke-system-settings",
  "\nH2: SECURITY_SMOKE_* -> npm run security:smoke-users-rls",
  "\nSkatīt security_check.md un README Supabase sadaļu.",
);
