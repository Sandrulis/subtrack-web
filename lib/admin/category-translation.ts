/** `site_translations` atslēga kategorijas nosaukumam panelī. */
export function categoryTranslationKey(categoryKey: string): string {
  return `subscription.category.${normalizeCategoryKeyForTranslation(categoryKey)}`;
}

export function normalizeCategoryKeyForTranslation(raw: string): string {
  return raw.trim().toLowerCase();
}

export function pickCategoryCatalogLabel(
  byLocale: Record<string, string>,
  defaultLocaleCode: string,
): string | null {
  const def = defaultLocaleCode.trim().toLowerCase();
  const preferred = (byLocale[def] ?? "").trim();
  if (preferred) return preferred.slice(0, 160);

  for (const value of Object.values(byLocale)) {
    const t = String(value ?? "").trim();
    if (t) return t.slice(0, 160);
  }
  return null;
}
