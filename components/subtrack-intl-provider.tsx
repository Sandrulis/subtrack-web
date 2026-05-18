"use client";

import { pickFallbackPhrase } from "@/lib/i18n/fallback-lookup";
import { applySystemNamePlaceholders } from "@/lib/system-name-placeholder";
import type { SubtrackPublicPaidPlan } from "@/lib/system-settings-public";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import type { LanguageOption } from "@/lib/languages-catalog";

type SubtrackIntlCtx = {
  locale: string;
  /** `public.system_settings.system_name` (bez vietturiem; zīmolam un vietturu aizpildei tulkošanā). */
  systemSiteName: string;
  /** Maksas plāna pitch no `system_settings` (cena, limits, ieslēgšana). */
  paidPlan: SubtrackPublicPaidPlan;
  /** Valodu izvēlne globālajam slēdzim (no `public.languages`). */
  languageOptions: LanguageOption[];
  t: (key: string) => string;
};

const PAID_PLAN_CTX_DEFAULT: SubtrackPublicPaidPlan = {
  enabled: false,
  priceEur: 1.99,
  freeSubscriptionLimit: 5,
};

const SubtrackIntlReactContext = createContext<SubtrackIntlCtx>({
  locale: "lv",
  systemSiteName: "SubTrack",
  paidPlan: PAID_PLAN_CTX_DEFAULT,
  languageOptions: [],
  t: (k) => k,
});

export function SubtrackIntlProvider({
  locale,
  systemSiteName,
  paidPlan,
  languageOptions = [],
  dbMap,
  children,
}: {
  locale: string;
  systemSiteName: string;
  paidPlan?: SubtrackPublicPaidPlan | null;
  languageOptions?: LanguageOption[];
  dbMap: Record<string, string>;
  children: ReactNode;
}) {
  const lc = locale.trim().toLowerCase();
  const brand = systemSiteName.trim() || "SubTrack";
  const plan = paidPlan ?? PAID_PLAN_CTX_DEFAULT;

  const t = useCallback(
    (key: string) => {
      const fromDb = dbMap[key];
      let s: string;
      if (typeof fromDb === "string" && fromDb.length > 0) {
        s = fromDb;
      } else {
        const fb = pickFallbackPhrase(key, lc);
        s = typeof fb === "string" && fb.length > 0 ? fb : key;
      }
      return applySystemNamePlaceholders(s, brand);
    },
    [brand, dbMap, lc],
  );

  const langs = useMemo(() => languageOptions ?? [], [languageOptions]);

  const value = useMemo(
    () => ({
      locale: lc,
      systemSiteName: brand,
      paidPlan: plan,
      languageOptions: langs,
      t,
    }),
    [brand, lc, langs, plan, t],
  );

  return (
    <SubtrackIntlReactContext.Provider value={value}>
      {children}
    </SubtrackIntlReactContext.Provider>
  );
}

export function useSubtrackIntl() {
  return useContext(SubtrackIntlReactContext);
}
