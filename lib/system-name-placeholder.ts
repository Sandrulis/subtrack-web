/** Tulkošanas virknēs: aizvieto ar aktīvo nosaukumu no DB (`system_settings.system_name`). */
const TOKENS = ["{SYSTEM_NAME}", "{SISTEM_NAME}"] as const;

export function applySystemNamePlaceholders(text: string, systemSiteName: string): string {
  const repl = systemSiteName;
  if (!text.includes("{")) return text;

  let out = text;
  for (const tok of TOKENS) {
    if (out.includes(tok)) {
      const parts = out.split(tok);
      out = parts.join(repl);
    }
  }
  return out;
}
