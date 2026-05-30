/**
 * Obligātās drošības migrācijas jaunām / atjauninātām Supabase vidēm.
 * npm run security:migration-checklist
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

/** Pēc H1: Pro trial, family, Advisor, Stripe, privātais aizdevums (secībā). */
const POST_CRITICAL = [
  "107_pro_trial.sql",
  "116_security_advisor_pro_trial_rpc.sql",
  "158_security_advisor_categories_last_seen_feedback.sql",
  "159_stripe_billing_users.sql",
  "160_site_translations_stripe_billing.sql",
  "161_private_loan.sql",
  "162_subscription_category_private_loan.sql",
];

console.log("SubTrack - obligātās drošības migrācijas (H1):\n");
for (const f of CRITICAL) {
  console.log(`  database/supabase/${f}`);
}

console.log("\nPēc H1 (Stripe / Advisor / privātais aizdevums):\n");
for (const f of POST_CRITICAL) {
  console.log(`  database/supabase/${f}`);
}

console.log(
  "\nPēc 078: npm run security:smoke-system-settings",
  "\nH2: SECURITY_SMOKE_* -> npm run security:smoke-users-rls",
  "\nPēc 159/161: npm run security:verify-migrations (ar SUPABASE_SERVICE_ROLE_KEY)",
  "\nDeploy: npm run security:deploy-checklist",
  "\nSkatīt security_check.md un README Supabase sadaļu.",
);
