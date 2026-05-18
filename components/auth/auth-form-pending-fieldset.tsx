"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

/** Atspējo laukus, kamēr forma iesniedz Server Action (poga ārpus fieldset). */
export function AuthFormPendingFieldset({ children }: { children: ReactNode }) {
  const { pending } = useFormStatus();
  return <fieldset disabled={pending}>{children}</fieldset>;
}
