import {
  buildLandingWebApplicationJsonLd,
  type WebApplicationJsonLd,
} from "@/lib/seo/landing-seo";

type LandingWebAppJsonLdProps = {
  brand: string;
};

export async function LandingWebAppJsonLd({ brand }: LandingWebAppJsonLdProps) {
  const data: WebApplicationJsonLd = await buildLandingWebApplicationJsonLd(brand);
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
