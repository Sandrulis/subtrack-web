import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LandingNavSync } from "@/components/landing-nav-sync";
import { LandingPageContent } from "@/components/landing-page";
import { NavLanding } from "@/components/nav-landing";
import { LandingWebAppJsonLd } from "@/components/seo/landing-web-app-json-ld";
import { getSessionUserDisplaySafe } from "@/lib/auth/user-display";
import { buildLandingPageMetadata } from "@/lib/seo/landing-seo";
import { getSystemSiteName } from "@/lib/system-settings-public";

export async function generateMetadata(): Promise<Metadata> {
  const brand = await getSystemSiteName();
  return await buildLandingPageMetadata(brand);
}

export default async function HomePage() {
  const userDisplay = await getSessionUserDisplaySafe();
  if (userDisplay) redirect("/dashboard");

  const brand = await getSystemSiteName();

  return (
    <>
      <LandingWebAppJsonLd brand={brand} />
      <NavLanding />
      <main id="main">
        <LandingPageContent />
      </main>
      <LandingNavSync />
    </>
  );
}
