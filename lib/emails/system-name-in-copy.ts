import type { EmailTemplateCopy } from "./template-types";

/** Vecais noklusējums DB/kodā – aizvietojam ar `{SYSTEM_NAME}`, ja iestatījumos ir cits nosaukums. */
export const LEGACY_DEFAULT_PRODUCT_NAME = "SubTrack";

const PLACEHOLDER = "{SYSTEM_NAME}";

/** Saglabāšanai/rediģēšanai: fiksēts nosaukums → vietturis. */
export function ensureSystemNamePlaceholder(text: string, systemName: string): string {
  let out = text;
  const name = systemName.trim();
  if (name) {
    out = out.split(name).join(PLACEHOLDER);
  }
  if (name !== LEGACY_DEFAULT_PRODUCT_NAME) {
    out = out.split(LEGACY_DEFAULT_PRODUCT_NAME).join(PLACEHOLDER);
  }
  return out;
}

export function ensureSystemNamePlaceholderInCopy(
  copy: EmailTemplateCopy,
  systemName: string,
): EmailTemplateCopy {
  return {
    subject: ensureSystemNamePlaceholder(copy.subject, systemName),
    preheader: ensureSystemNamePlaceholder(copy.preheader, systemName),
    headline: ensureSystemNamePlaceholder(copy.headline, systemName),
    body: ensureSystemNamePlaceholder(copy.body, systemName),
    ctaLabel: ensureSystemNamePlaceholder(copy.ctaLabel, systemName),
    footerNote: ensureSystemNamePlaceholder(copy.footerNote, systemName),
  };
}
