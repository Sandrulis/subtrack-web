"use client";

import { useEffect, useState } from "react";

/** True when the primary input supports hover tooltips (mouse / fine pointer). */
export function useSupportsHoverTooltip(): boolean {
  const [supports, setSupports] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const apply = () => setSupports(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  return supports;
}
