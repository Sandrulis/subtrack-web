const SUPPORTED = ["lv", "en", "ru"] as const;

export type HtmlLang = (typeof SUPPORTED)[number];

export function pickHtmlLang(acceptLanguage: string | null): HtmlLang {
  if (!acceptLanguage) return "lv";

  const codes = acceptLanguage
    .split(",")
    .map((part) => part.split(";")[0]!.trim().toLowerCase())
    .map((code) => code.split("-")[0]!);

  for (const code of codes) {
    if ((SUPPORTED as readonly string[]).includes(code)) {
      return code as HtmlLang;
    }
  }
  return "lv";
}
