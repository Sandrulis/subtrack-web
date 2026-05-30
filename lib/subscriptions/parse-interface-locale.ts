import { normalizeEmailLocale, type EmailPreviewLocale } from "@/lib/emails/template-types";

export function parseInterfaceLocale(
  displayPreferences: unknown,
): EmailPreviewLocale {
  if (!displayPreferences || typeof displayPreferences !== "object") {
    return "lv";
  }
  const code = String(
    (displayPreferences as Record<string, unknown>).interface_language_code ?? "",
  );
  return normalizeEmailLocale(code);
}
