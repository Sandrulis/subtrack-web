/** Tulkošanas virknēs: aizvieto ar aktīvo nosaukumu no DB (`system_settings.system_name`). */
const TOKENS = ["{SYSTEM_NAME}", "{SISTEM_NAME}"] as const;

/** Pagaidu nosaukums pēc migrācijas `070_*` – aizvieto ar `system_name`, kamēr DB teksti vēl nav atjaunināti. */
const LEGACY_INTERIM_PRODUCT_NAME = "repazy";

export function applySystemNamePlaceholders(text: string, systemSiteName: string): string {
  const repl = systemSiteName.trim();
  if (!repl) return text;

  let out = text;
  if (repl !== LEGACY_INTERIM_PRODUCT_NAME && out.includes(LEGACY_INTERIM_PRODUCT_NAME)) {
    out = out.split(LEGACY_INTERIM_PRODUCT_NAME).join(repl);
  }

  if (!out.includes("{")) return out;

  for (const tok of TOKENS) {
    if (out.includes(tok)) {
      out = out.split(tok).join(repl);
    }
  }
  return out;
}
