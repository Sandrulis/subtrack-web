"use client";

import { pickFallbackPhrase } from "@/lib/i18n/fallback-lookup";
import { applySystemNamePlaceholders } from "@/lib/system-name-placeholder";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";

type SubtrackIntlCtx = {
  locale: string;
  /** `public.system_settings.system_name` (bez vietturiem; zīmolam un vietturu aizpildei tulkošanā). */
  systemSiteName: string;
  t: (key: string) => string;
};

const SubtrackIntlReactContext = createContext<SubtrackIntlCtx>({
  locale: "lv",
  systemSiteName: "SubTrack",
  t: (k) => k,
});

export function SubtrackIntlProvider({
  locale,
  systemSiteName,
  dbMap,
  children,
}: {
  locale: string;
  systemSiteName: string;
  dbMap: Record<string, string>;
  children: ReactNode;
}) {
  const lc = locale.trim().toLowerCase();
  const brand = systemSiteName.trim() || "SubTrack";

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

  const value = useMemo(
    () => ({ locale: lc, systemSiteName: brand, t }),
    [brand, lc, t],
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
