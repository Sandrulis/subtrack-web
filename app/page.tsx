import type { Metadata } from "next";
import { NavLanding } from "@/components/nav-landing";
import { LandingPageContent } from "@/components/landing-page";
import { LandingNavSync } from "@/components/landing-nav-sync";
import { BodyLandingPageClass } from "@/components/body-landing-class";
import { LandingSessionScripts } from "@/components/landing-session-scripts";
import { getSessionUserDisplaySafe } from "@/lib/auth/user-display";

export const metadata: Metadata = {
  title: "SubTrack – abonementu un periodisko maksājumu pārvaldība",
  description:
    "Pārvaldi abonementus, rēķinus un citus periodiskos maksājumus vienuviet. Kalendārs, analītika un atgādinājumi vienkāršā un modernā panelī.",
};

export default async function HomePage() {
  const userDisplay = await getSessionUserDisplaySafe();

  return (
    <BodyLandingPageClass>
      <NavLanding userDisplay={userDisplay} />
      <LandingPageContent />
      {userDisplay ? null : <LandingNavSync />}
      {userDisplay ? <LandingSessionScripts /> : null}
    </BodyLandingPageClass>
  );
}
