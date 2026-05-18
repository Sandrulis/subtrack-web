import {
  buildLandingWebApplicationJsonLd,
  type WebApplicationJsonLd,
} from "@/lib/seo/landing-seo";

type LandingWebAppJsonLdProps = {
  brand: string;
};

export function LandingWebAppJsonLd({ brand }: LandingWebAppJsonLdProps) {
  const data: WebApplicationJsonLd = buildLandingWebApplicationJsonLd(brand);
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
