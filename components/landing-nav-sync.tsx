"use client";

import { useEffect } from "react";

const ID_ORDER = ["features", "demo", "faq"];

export function LandingNavSync() {
  useEffect(() => {
    const sections: HTMLElement[] = [];
    for (let i = 0; i < ID_ORDER.length; i++) {
      const el = document.getElementById(ID_ORDER[i]!);
      if (el) sections.push(el);
    }

    const links = document.querySelectorAll("a[data-landing-anchor]");
    if (!sections.length || !links.length) return;

    function setLandingActive(id: string) {
      links.forEach((link) => {
        const key = link.getAttribute("data-landing-anchor");
        if (key === id) {
          link.classList.add("is-active");
          link.setAttribute("aria-current", "page");
        } else {
          link.classList.remove("is-active");
          link.removeAttribute("aria-current");
        }
      });
    }

    function topDocument(node: HTMLElement) {
      return node.getBoundingClientRect().top + window.scrollY;
    }

    function syncLandingNav() {
      const offset = 96;
      const pos = window.scrollY + offset;
      let picked = sections[0]!.id;
      for (let k = 0; k < sections.length; k++) {
        const t = topDocument(sections[k]!);
        if (t <= pos) picked = sections[k]!.id;
      }
      setLandingActive(picked);
    }

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        syncLandingNav();
        ticking = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("hashchange", syncLandingNav);
    syncLandingNav();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("hashchange", syncLandingNav);
    };
  }, []);

  return null;
}
