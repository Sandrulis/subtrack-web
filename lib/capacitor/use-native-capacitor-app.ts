"use client";

import { useEffect, useState } from "react";
import { isNativeCapacitorApp } from "@/lib/capacitor/native-app";

/** Pēc hydrācijas – lai SSR un klients nesaskanētu. */
export function useNativeCapacitorApp(): boolean {
  const [native, setNative] = useState(() =>
    typeof window !== "undefined" ? isNativeCapacitorApp() : false,
  );
  useEffect(() => {
    setNative(isNativeCapacitorApp());
  }, []);
  return native;
}
