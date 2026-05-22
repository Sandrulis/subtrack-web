"use client";

import { DEFAULT_SYSTEM_NAME } from "@/lib/pwa/defaults";
import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";

export type NavBrandSnapshot = {
  label: string;
  logoTopbar: string | null;
};

const NavBrandContext = createContext<NavBrandSnapshot | null>(null);

/** Vieglā zīmola vērtība SSR/hydrācijai (neatkarīgi no lielā `dbMap` Intl kontekstā). */
export function NavBrandBridge({
  label,
  logoTopbar,
  children,
}: NavBrandSnapshot & { children: ReactNode }) {
  const value = useMemo(
    () => ({
      label: label.trim() || DEFAULT_SYSTEM_NAME,
      logoTopbar: logoTopbar?.trim() ? logoTopbar.trim() : null,
    }),
    [label, logoTopbar],
  );

  return (
    <NavBrandContext.Provider value={value}>{children}</NavBrandContext.Provider>
  );
}

export function useNavBrand(): NavBrandSnapshot | null {
  return useContext(NavBrandContext);
}
