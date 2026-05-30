/**
 * Produkcijas / pēc git pull drošības deploy checklist (teksts terminālī).
 * npm run security:deploy-checklist
 */

const SQL_STRIPE_AND_LOAN = [
  "158_security_advisor_categories_last_seen_feedback.sql",
  "159_stripe_billing_users.sql",
  "160_site_translations_stripe_billing.sql",
  "161_private_loan.sql",
  "162_subscription_category_private_loan.sql",
];

console.log(`
SubTrack - drošības deploy checklist (2026-05-30)
=================================================

1) Supabase SQL Editor (secībā, ja vēl nav):
`);
for (const f of SQL_STRIPE_AND_LOAN) {
  console.log(`   database/supabase/${f}`);
}

console.log(`
2) Pārbaudi migrācijas (lokāli ar .env.local):
   npm run security:verify-migrations

3) Leaked password protection (Dashboard, nav SQL):
   Supabase Dashboard -> Authentication -> Providers -> Email
   Ieslēdz "Prevent use of leaked passwords" (Have I Been Pwned)
   Piezīme: Supabase Pro plānā; Free projektā Advisor brīdinājums var palikt.

4) Vercel ENV (ja Stripe live):
   STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, SUPABASE_SERVICE_ROLE_KEY, CRON_SECRET
   Opcija: UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN

5) Cron (cron-job.org): Authorization: Bearer <CRON_SECRET> (ne ?secret= URL)

6) Pēc deploy:
   npm run security:check

Pilns H1 saraksts: npm run security:migration-checklist
Dokumentācija: security_check.md
`);
