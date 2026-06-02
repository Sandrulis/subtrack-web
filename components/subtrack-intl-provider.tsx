"use client";

import { pickFallbackPhrase } from "@/lib/i18n/fallback-lookup";
import { applySystemNamePlaceholders } from "@/lib/system-name-placeholder";
import { DEFAULT_SYSTEM_NAME } from "@/lib/pwa/defaults";
import type { PublicBrandLogoAssets } from "@/lib/brand/logo-assets";
import type { PublicPwaSettings } from "@/lib/pwa/public-pwa-settings";
import { normalizePwaRow } from "@/lib/pwa/public-pwa-settings";
import type { SubtrackPublicPaidPlan } from "@/lib/system-settings-public";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import type { LanguageOption } from "@/lib/languages-catalog";

export type SubtrackIntegrationFlags = {
  familySharingEnabled: boolean;
};

type SubtrackIntlCtx = {
  locale: string;
  /** Vismaz viens publicēts bloga ieraksts (footer saitei). */
  hasPublishedBlogPosts: boolean;
  /** `public.system_settings.system_name` (bez vietturiem; zīmolam un vietturu aizpildei tulkošanā). */
  systemSiteName: string;
  /** Augšupielādēts logo; `null` = ģenerētā ikona `/icon`. */
  brandLogo: PublicBrandLogoAssets | null;
  /** Maksas plāna pitch no `system_settings` (cena, limits, ieslēgšana). */
  paidPlan: SubtrackPublicPaidPlan;
  /** Admin slēdzis: ja false, reģistrācijas UI ir slēgts. */
  signupEnabled: boolean;
  pwa: PublicPwaSettings;
  integrations: SubtrackIntegrationFlags;
  /** Valodu izvēlne globālajam slēdzim (no `public.languages`). */
  languageOptions: LanguageOption[];
  t: (key: string) => string;
};

const PAID_PLAN_CTX_DEFAULT: SubtrackPublicPaidPlan = {
  enabled: false,
  priceEur: 1.99,
  freeSubscriptionLimit: 5,
  annualBillingEnabled: false,
  annualPriceEur: null,
  lifetime: {
    enabled: false,
    priceEur: null,
    endsAt: null,
    purchaseLimit: null,
    purchaseCount: 0,
    active: false,
    remainingMs: null,
    purchasesRemaining: null,
  },
};

const SubtrackIntlReactContext = createContext<SubtrackIntlCtx>({
  locale: "lv",
  hasPublishedBlogPosts: false,
  systemSiteName: DEFAULT_SYSTEM_NAME,
  brandLogo: null,
  paidPlan: PAID_PLAN_CTX_DEFAULT,
  signupEnabled: true,
  pwa: normalizePwaRow(null, DEFAULT_SYSTEM_NAME),
  integrations: { familySharingEnabled: false },
  languageOptions: [],
  t: (k) => k,
});

export function SubtrackIntlProvider({
  locale,
  hasPublishedBlogPosts = false,
  systemSiteName,
  brandLogo: brandLogoProp,
  paidPlan,
  signupEnabled: signupEnabledProp = true,
  pwa: pwaProp,
  integrations: integrationsProp,
  languageOptions = [],
  dbMap,
  children,
}: {
  locale: string;
  hasPublishedBlogPosts?: boolean;
  systemSiteName: string;
  brandLogo?: PublicBrandLogoAssets | null;
  paidPlan?: SubtrackPublicPaidPlan | null;
  signupEnabled?: boolean;
  pwa?: PublicPwaSettings | null;
  integrations?: SubtrackIntegrationFlags | null;
  languageOptions?: LanguageOption[];
  dbMap: Record<string, string>;
  children: ReactNode;
}) {
  const lc = locale.trim().toLowerCase();
  const brand = systemSiteName.trim() || DEFAULT_SYSTEM_NAME;
  const brandLogo = brandLogoProp ?? null;
  const plan = paidPlan ?? PAID_PLAN_CTX_DEFAULT;
  const signupEnabled = signupEnabledProp !== false;
  const pwa = pwaProp ?? normalizePwaRow(null, brand);
  const integrations = integrationsProp ?? { familySharingEnabled: false };

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
      hasPublishedBlogPosts,
      systemSiteName: brand,
      brandLogo,
      paidPlan: plan,
      signupEnabled,
      pwa,
      integrations,
      languageOptions: langs,
      t,
    }),
    [brand, brandLogo, hasPublishedBlogPosts, integrations, lc, langs, plan, signupEnabled, pwa, t],
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
