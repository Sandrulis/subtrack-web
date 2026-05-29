"use client";

import { SupportHelpModal } from "@/components/support/support-help-modal";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

type SupportHelpContextValue = {
  open: () => void;
};

const SupportHelpContext = createContext<SupportHelpContextValue | null>(null);

export function SupportHelpProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const openSupport = useCallback(() => setOpen(true), []);
  const value = useMemo(() => ({ open: openSupport }), [openSupport]);

  return (
    <SupportHelpContext.Provider value={value}>
      {children}
      <SupportHelpModal open={open} onClose={() => setOpen(false)} />
    </SupportHelpContext.Provider>
  );
}

export function useSupportHelp(): SupportHelpContextValue {
  const ctx = useContext(SupportHelpContext);
  if (!ctx) {
    throw new Error("useSupportHelp must be used within SupportHelpProvider");
  }
  return ctx;
}
