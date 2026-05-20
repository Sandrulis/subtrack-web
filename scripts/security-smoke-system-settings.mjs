/**
 * Smoke: anon nedrīkst lasīt system_settings_email_templates;
 * system_settings (bez šabloniem) ir publiski pieejams.
 *
 * .env.local: NEXT_PUBLIC_SUPABASE_*
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

async function main() {
  if (!url || !anon) {
    console.log("[security-smoke-system-settings] Bez Supabase URL/anon - izlaists.");
    process.exit(0);
  }

  const supabase = createClient(url, anon);

  const sensitive = await supabase
    .from("system_settings_email_templates")
    .select("email_templates")
    .eq("id", 1)
    .maybeSingle();

  if (!sensitive.error && sensitive.data?.email_templates != null) {
    const keys =
      typeof sensitive.data.email_templates === "object"
        ? Object.keys(sensitive.data.email_templates).length
        : 1;
    if (keys > 0) {
      console.error(
        "[security-smoke-system-settings] KĻŪDA: anon lasa email_templates. Palaid 078_system_settings_email_templates_split.sql.",
      );
      process.exit(1);
    }
  }

  if (sensitive.error) {
    const code = sensitive.error.code ?? "";
    const msg = sensitive.error.message ?? "";
    const blocked =
      code === "42501" ||
      /permission|policy|denied|row-level|RLS|PGRST116/i.test(msg) ||
      /does not exist/i.test(msg);
    if (!blocked) {
      console.error("[security-smoke-system-settings] Nezināma kļūda:", msg);
      process.exit(1);
    }
    console.log(
      "[security-smoke-system-settings] OK - email_templates tabula bloķēta anon:",
      code || msg,
    );
  } else {
    console.log(
      "[security-smoke-system-settings] OK - email_templates nav pieejams anon.",
    );
  }

  const legacyView = await supabase
    .from("system_settings_public")
    .select("system_name")
    .eq("id", 1)
    .maybeSingle();

  if (!legacyView.error && legacyView.data?.system_name) {
    console.error(
      "[security-smoke-system-settings] KĻŪDA: system_settings_public skats vēl eksistē. Palaid 078.",
    );
    process.exit(1);
  }

  const pub = await supabase
    .from("system_settings")
    .select("system_name")
    .eq("id", 1)
    .maybeSingle();

  if (pub.error) {
    console.error(
      "[security-smoke-system-settings] KĻŪDA: system_settings nav pieejams:",
      pub.error.message,
    );
    process.exit(1);
  }

  if (!pub.data?.system_name) {
    console.error("[security-smoke-system-settings] KĻŪDA: system_settings bez system_name.");
    process.exit(1);
  }

  const leakCol = await supabase
    .from("system_settings")
    .select("email_templates")
    .eq("id", 1)
    .maybeSingle();

  if (!leakCol.error && leakCol.data && "email_templates" in leakCol.data) {
    console.error(
      "[security-smoke-system-settings] KĻŪDA: system_settings vēl satur email_templates kolonnu. Palaid 078.",
    );
    process.exit(1);
  }

  console.log(
    "[security-smoke-system-settings] OK - publiskie iestatījumi:",
    pub.data.system_name,
  );
  process.exit(0);
}

await main();
