/**
 * L2 – statiska regresijas pārbaude (bez Supabase savienojuma).
 * npm run security:regression-check
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");

const errors = [];
const warnings = [];

function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) {
      if (name === "node_modules" || name === ".next" || name === ".git") continue;
      walk(full, acc);
    } else {
      acc.push(full);
    }
  }
  return acc;
}

function rel(p) {
  return path.relative(ROOT, p).replace(/\\/g, "/");
}

/** Noņem App Router route grupas, piem. `app/(app)/api` → `app/api`. */
function normalizeAppRoutePath(routeRel) {
  return routeRel.replace(/\/\([^)]+\)\//g, "/");
}

function isUnder(file, prefix) {
  const r = normalizeAppRoutePath(rel(file));
  return r === prefix || r.startsWith(`${prefix}/`);
}

/** Sesijas pārbaude route handlerī (tieši getUser vai centralizēti helperi). */
function hasApiSessionAuth(text) {
  return (
    /\.auth\.getUser\s*\(/.test(text) ||
    /requireApiSession\s*\(/.test(text) ||
    /requireApiAdmin\s*\(/.test(text)
  );
}

/** Stripe webhook – paraksts, ne Supabase sesija. */
function hasStripeWebhookAuth(text) {
  return /constructEvent\s*\(/.test(text) && /stripe-signature/.test(text);
}

/** Cron: Bearer CRON_SECRET vai admin manuālais palaidējs. */
function hasCronRouteAuth(text, routePath) {
  if (/authorizeCron|createAuthorizedCronGetRoute/.test(text)) return true;
  if (routePath.includes("admin/cron") && /requireApiAdmin/.test(text)) return true;
  return /CRON_SECRET/.test(text);
}

/** Autorizācijas brīdinājums nav vajadzīgs, ja ir admin helper vai skaidrs user_id filtrs. */
function hasUserScopeOrAdminAuth(text) {
  return (
    /requireApiAdmin\s*\(/.test(text) ||
    /\.eq\(\s*["']user_id["']/.test(text) ||
    /\.eq\(\s*["']owner_user_id["'],\s*user\.id/.test(text) ||
    /\.eq\(\s*["']partner_user_id["'],\s*user\.id/.test(text) ||
    /\.eq\(\s*["']id["'],\s*user\.id/.test(text) ||
    /user_id:\s*user\.id/.test(text) ||
    /owner_user_id:\s*user\.id/.test(text) ||
    /auth\.user\.id/.test(text) ||
    /current_user_is_admin|admin_set_user/.test(text) ||
    hasStripeWebhookAuth(text)
  );
}

const tsFiles = walk(ROOT).filter((f) => /\.(ts|tsx)$/.test(f));
const jsFsFiles = walk(path.join(ROOT, "public", "fs", "js")).filter((f) => f.endsWith(".js"));

// L2.4 – nav NEXT_PUBLIC service role
for (const f of [...tsFiles, path.join(ROOT, ".env.example"), path.join(ROOT, "supabase.env.template")].filter(
  (x) => typeof x === "string" && fs.existsSync(x),
)) {
  const text = fs.readFileSync(f, "utf8");
  if (/NEXT_PUBLIC_.*SERVICE.*ROLE/i.test(text)) {
    errors.push(`${rel(f)}: NEXT_PUBLIC_* nedrīkst saturēt SERVICE_ROLE`);
  }
}

// service_role tikai servera failos (ne "use client")
const serviceRoleImportRe = /from\s+["']@\/lib\/supabase\/service-role-client["']/;
for (const f of tsFiles) {
  const text = fs.readFileSync(f, "utf8");
  if (!serviceRoleImportRe.test(text)) continue;
  if (/^["']use client["']/m.test(text)) {
    errors.push(`${rel(f)}: service-role-client nedrīkst "use client" modulī`);
  }
}

// L2.2 – admin *-actions ar requireAdminUser
const adminActionsDir = path.join(ROOT, "lib", "admin");
if (fs.existsSync(adminActionsDir)) {
  for (const name of fs.readdirSync(adminActionsDir)) {
    if (!name.endsWith("-actions.ts")) continue;
    const f = path.join(adminActionsDir, name);
    const text = fs.readFileSync(f, "utf8");
    if (!/requireAdminUser/.test(text)) {
      errors.push(`${rel(f)}: trūkst requireAdminUser`);
    }
    const exports = [...text.matchAll(/export\s+async\s+function\s+(\w+)/g)].map((m) => m[1]);
    for (const fn of exports) {
      const fnBody = text.split(new RegExp(`export\\s+async\\s+function\\s+${fn}`))[1];
      if (fnBody && !fnBody.slice(0, 800).includes("requireAdminUser")) {
        errors.push(`${rel(f)}: export ${fn}() bez requireAdminUser tuvumā`);
      }
    }
  }
}

// L2.3 – API route handlers (izņēmumi: cron, dev-env-check); atbalsta route grupas app/(app)/api
const appDir = path.join(ROOT, "app");
const apiRoutes = walk(appDir).filter(
  (f) =>
    (f.endsWith(`${path.sep}route.ts`) || f.endsWith("/route.ts")) &&
    normalizeAppRoutePath(rel(f)).includes("/api/"),
);
for (const f of apiRoutes) {
  const r = normalizeAppRoutePath(rel(f));
  const text = fs.readFileSync(f, "utf8");
  if (r.includes("dev-env-check") || r.includes("sentry-test")) continue;
  if (r.includes("stripe/webhook")) {
    if (!hasStripeWebhookAuth(text)) {
      errors.push(`${r}: Stripe webhook bez constructEvent / stripe-signature`);
    }
    continue;
  }
  if (r.includes("cron/") || r.includes("admin/cron/")) {
    if (!hasCronRouteAuth(text, r)) {
      warnings.push(`${r}: cron route – pārbaudi CRON_SECRET / authorizeCron / requireApiAdmin`);
    }
    if (/searchParams\.get\s*\(\s*["']secret["']\s*\)/.test(text)) {
      errors.push(`${r}: cron nedrīkst lietot ?secret= query (izmanto Bearer)`);
    }
    if (r.includes("admin/cron/")) continue;
    continue;
  }
  if (!hasApiSessionAuth(text)) {
    errors.push(`${r}: API route bez sesijas pārbaudes (getUser / requireApiSession / requireApiAdmin)`);
  }
  if (!hasUserScopeOrAdminAuth(text)) {
    warnings.push(`${r}: pārbaudi user_id / admin autorizāciju`);
  }
}

// L2.4 – email_templates tikai system_settings_email_templates (admin/cron)
const allowEmailTemplatesTable = (file) =>
  isUnder(file, "lib/admin") ||
  isUnder(file, "lib/cron") ||
  isUnder(file, "lib/emails") ||
  isUnder(file, "app/admin") ||
  isUnder(file, "app/api/cron") ||
  isUnder(file, "scripts");

for (const f of tsFiles) {
  const text = fs.readFileSync(f, "utf8");
  if (/\.from\(\s*["']system_settings_public["']\s*\)/.test(text)) {
    errors.push(
      `${rel(f)}: system_settings_public noņemts (078) – lieto system_settings`,
    );
  }
  if (allowEmailTemplatesTable(f)) continue;
  if (
    /\.from\(\s*["']system_settings["']\s*\)[\s\S]{0,200}email_templates/.test(text) ||
    /email_templates[\s\S]{0,200}\.from\(\s*["']system_settings["']\s*\)/.test(text)
  ) {
    errors.push(
      `${rel(f)}: email_templates lasīt no system_settings_email_templates (078)`,
    );
  }
}

// FS innerHTML – brīdinājums par iespējamu XSS
const escRe = /escHtml|escAttr|JSON\.stringify/;
const safeInnerHtmlMapRe =
  /\.map\s*\(\s*(?:function|build)|\.map\(build|\breturn\s+build/;
for (const f of jsFsFiles) {
  const text = fs.readFileSync(f, "utf8");
  const lines = text.split("\n");
  lines.forEach((line, i) => {
    if (!/\.innerHTML\s*=/.test(line)) return;
    const windowAfter = lines.slice(i, Math.min(i + 10, lines.length)).join("\n");
    const windowBefore = lines.slice(Math.max(0, i - 20), i + 1).join("\n");
    if (escRe.test(windowAfter) || escRe.test(windowBefore)) return;
    if (safeInnerHtmlMapRe.test(line) || safeInnerHtmlMapRe.test(windowAfter)) return;
    if (/innerHTML\s*=\s*['"`]\s*['"`]/.test(line)) return;
    if (/innerHTML\s*=\s*['"`]<svg/.test(line)) return;
    warnings.push(
      `${rel(f)}:${i + 1}: innerHTML bez escHtml – pārbaudi datu avotu (L2 / FS demos)`,
    );
  });
}

console.log("[security-regression-check] L2 statiskā pārbaude\n");

if (warnings.length) {
  console.log(`Brīdinājumi (${warnings.length}):`);
  for (const w of warnings) console.log("  ⚠", w);
  console.log("");
}

if (errors.length) {
  console.error(`Kļūdas (${errors.length}):`);
  for (const e of errors) console.error("  ✗", e);
  process.exit(1);
}

console.log("[security-regression-check] OK – nav regresijas signālu.");
process.exit(0);
