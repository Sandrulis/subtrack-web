import { NextResponse } from "next/server";
import { getFsIconPickerSearchBootstrap } from "@/lib/fs-icon-picker-search";
import { getSubscriptionVisualSuggestBootstrap } from "@/lib/subscription-visual-suggest";

/**
 * Ikonu / vizuālo ieteikumu bootstrap – publisks katalogs (nav lietotāja datu).
 * Ielādē pie pievienošanas/labošanas modāļa (ne SSR HTML), arī `/demo/dashboard`.
 */
export async function GET() {
  const visual = getSubscriptionVisualSuggestBootstrap();
  return NextResponse.json(
    {
      icons: visual.icons,
      colors: visual.colors,
      brandRules: visual.brandRules,
      iconSearch: getFsIconPickerSearchBootstrap(),
    },
    {
      headers: {
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    },
  );
}
