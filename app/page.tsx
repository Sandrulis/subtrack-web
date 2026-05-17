import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BodyLandingPageClass } from "@/components/body-landing-class";
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
  if (userDisplay) redirect("/dashboard");

  return (
    <BodyLandingPageClass>
      <NavLanding />
      <LandingPageContent />
      <LandingNavSync />
    </BodyLandingPageClass>
  );
}
