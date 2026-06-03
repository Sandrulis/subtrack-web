/**
 * Pārbauda, vai Stripe (159) un privātais aizdevums (161) kolonnas eksistē DB.
 * Nepieciešams SUPABASE_SERVICE_ROLE_KEY (+ NEXT_PUBLIC_SUPABASE_URL).
 *
 * npm run security:verify-migrations
 */
import nextEnv from "@next/env";
import { createClient } from "@supabase/supabase-js";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

const CHECKS = [
  {
    id: "159",
    file: "159_stripe_billing_users.sql",
    table: "users",
    columns: ["paid_plan_type", "stripe_customer_id", "paid_plan_auto_renew"],
  },
  {
    id: "161",
    file: "161_private_loan.sql",
    table: "subscriptions",
    columns: ["is_private_loan", "loan_payments"],
  },
  {
    id: "174",
    file: "174_user_support_requests.sql",
    table: "user_support_requests",
    columns: ["message", "email_sent"],
  },
];

async function columnExists(supabase, table, column) {
  const { error } = await supabase.from(table).select(column).limit(0);
  if (!error) return true;
  const msg = String(error.message ?? "").toLowerCase();
  if (error.code === "42703" || msg.includes(column.toLowerCase())) return false;
  console.error(`  [${table}.${column}] neparedzēta kļūda:`, error.message);
  return null;
}

async function main() {
  if (!url || !serviceKey) {
    console.log(
      "[security-verify-migrations] Bez NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY - izlaists.",
    );
    console.log("  Pēc SQL 159/161/174 palaid ar .env.local vai CI secrets.");
    process.exit(0);
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let failed = false;

  for (const check of CHECKS) {
    console.log(`\n[${check.id}] ${check.file}`);
    for (const col of check.columns) {
      const ok = await columnExists(supabase, check.table, col);
      if (ok === true) {
        console.log(`  OK  ${check.table}.${col}`);
      } else if (ok === false) {
        console.error(`  FAIL  ${check.table}.${col} - palaid database/supabase/${check.file}`);
        failed = true;
      } else {
        failed = true;
      }
    }
  }

  if (failed) {
    console.error("\n[security-verify-migrations] Trūkst migrāciju - skat. npm run security:migration-checklist");
    process.exit(1);
  }

  console.log("\n[security-verify-migrations] OK - 159, 161 un 174 kolonnas redzamas.");
  process.exit(0);
}

main().catch((e) => {
  console.error("[security-verify-migrations]", e);
  process.exit(1);
});
