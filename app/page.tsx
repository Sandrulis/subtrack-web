import type { Metadata } from "next";
import { BodyLandingPageClass } from "@/components/body-landing-class";
import { FsNotifyI18nBootstrap } from "@/components/fs/fs-notify-i18n-bootstrap";
import { LandingNavSync } from "@/components/landing-nav-sync";
import { LandingPageContent } from "@/components/landing-page";
import { NavLanding } from "@/components/nav-landing";
import { getSessionUserDisplaySafe } from "@/lib/auth/user-display";
import { getSystemSiteName } from "@/lib/system-settings-public";

export async function generateMetadata(): Promise<Metadata> {
  const brand = await getSystemSiteName();
  return {
    title: `${brand} – abonementu un periodisko maksājumu pārvaldība`,
    description:
      "Pārvaldi abonementus, rēķinus un citus periodiskos maksājumus vienuviet. Kalendārs, analītika un atgādinājumi vienkāršā un modernā panelī.",
  };
}

export default async function HomePage() {
  const userDisplay = await getSessionUserDisplaySafe();

  return (
    <BodyLandingPageClass>
      {userDisplay ? <FsNotifyI18nBootstrap /> : null}
      <NavLanding userDisplay={userDisplay} />
      <LandingPageContent />
      {userDisplay ? null : <LandingNavSync />}
    </BodyLandingPageClass>
  );
}
