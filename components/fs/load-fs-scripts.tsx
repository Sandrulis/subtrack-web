"use client";

import { useEffect } from "react";

function loadScriptOnce(src: string): Promise<void> {
  const abs = new URL(src, window.location.origin).href;
  if (Array.from(document.scripts).some((s) => s.src === abs)) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.async = false;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Neizdevās ielādēt: ${src}`));
    document.body.appendChild(s);
  });
}

export function FsScripts({ srcs }: { srcs: readonly string[] }) {
  useEffect(() => {
    let cancelled = false;
    const list = [...srcs];
    (async () => {
      for (const src of list) {
        if (cancelled) break;
        try {
          await loadScriptOnce(src);
        } catch (e) {
          console.error(e);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // FS skripti jāielādē reizi pēc mount (atkārtota ielāde novērsta loadScriptOnce).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
