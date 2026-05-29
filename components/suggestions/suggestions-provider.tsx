"use client";

import { SuggestionsModal } from "@/components/suggestions/suggestions-modal";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

type SuggestionsContextValue = {
  open: () => void;
};

const SuggestionsContext = createContext<SuggestionsContextValue | null>(null);

export function SuggestionsProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const openSuggestions = useCallback(() => setOpen(true), []);
  const value = useMemo(() => ({ open: openSuggestions }), [openSuggestions]);

  return (
    <SuggestionsContext.Provider value={value}>
      {children}
      <SuggestionsModal open={open} onClose={() => setOpen(false)} />
    </SuggestionsContext.Provider>
  );
}

export function useSuggestions(): SuggestionsContextValue {
  const ctx = useContext(SuggestionsContext);
  if (!ctx) {
    throw new Error("useSuggestions must be used within SuggestionsProvider");
  }
  return ctx;
}
