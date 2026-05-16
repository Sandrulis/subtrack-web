"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { FlashParamToast, HoverPauseToast } from "@/components/flash-param-toast";

export type AuthToastSetter = (message: string | null) => void;

const AuthToastDispatchContext = createContext<AuthToastSetter | null>(null);

export function useAuthToastDispatch(): AuthToastSetter | null {
  return useContext(AuthToastDispatchContext);
}

/**
 * Apvieno URL flash (login/signup) un klienta kļūdas (OAuth), viena toast kolonna.
 */
export function AuthToastsHost({
  children,
  urlError,
  urlMessage,
}: {
  children: ReactNode;
  urlError?: string;
  urlMessage?: string;
}) {
  const [socialError, setSocialError] = useState<string | null>(null);

  return (
    <AuthToastDispatchContext.Provider value={setSocialError}>
      {children}
      <div className="toast-container toast-container--auth-pages">
        <FlashParamToast error={urlError} message={urlMessage} />
        <HoverPauseToast
          show={Boolean(socialError)}
          text={socialError ?? ""}
          variant="error"
          onDismissed={() => setSocialError(null)}
        />
      </div>
    </AuthToastDispatchContext.Provider>
  );
}
