export type LegalDocId = "terms" | "privacy" | "cookies";

export type LegalSectionDef = {
  titleKey: string;
  bodyKey: string;
};

export const LEGAL_DOC_SECTIONS: Record<LegalDocId, LegalSectionDef[]> = {
  terms: [
    { titleKey: "legal.terms.s1.title", bodyKey: "legal.terms.s1.body" },
    { titleKey: "legal.terms.s2.title", bodyKey: "legal.terms.s2.body" },
    { titleKey: "legal.terms.s3.title", bodyKey: "legal.terms.s3.body" },
    { titleKey: "legal.terms.s4.title", bodyKey: "legal.terms.s4.body" },
    { titleKey: "legal.terms.s5.title", bodyKey: "legal.terms.s5.body" },
    { titleKey: "legal.terms.s6.title", bodyKey: "legal.terms.s6.body" },
  ],
  privacy: [
    { titleKey: "legal.privacy.s1.title", bodyKey: "legal.privacy.s1.body" },
    { titleKey: "legal.privacy.s2.title", bodyKey: "legal.privacy.s2.body" },
    { titleKey: "legal.privacy.s3.title", bodyKey: "legal.privacy.s3.body" },
    { titleKey: "legal.privacy.s4.title", bodyKey: "legal.privacy.s4.body" },
    { titleKey: "legal.privacy.s5.title", bodyKey: "legal.privacy.s5.body" },
    { titleKey: "legal.privacy.s6.title", bodyKey: "legal.privacy.s6.body" },
  ],
  cookies: [
    { titleKey: "legal.cookies.s1.title", bodyKey: "legal.cookies.s1.body" },
    { titleKey: "legal.cookies.s2.title", bodyKey: "legal.cookies.s2.body" },
    { titleKey: "legal.cookies.s3.title", bodyKey: "legal.cookies.s3.body" },
    { titleKey: "legal.cookies.s4.title", bodyKey: "legal.cookies.s4.body" },
  ],
};

export function legalDocTitleKey(doc: LegalDocId): string {
  return `legal.${doc}.page_title`;
}

export function legalDocUpdatedKey(doc: LegalDocId): string {
  return `legal.${doc}.updated`;
}

export function legalDocMetaTitleKey(doc: LegalDocId): string {
  return `meta.title.legal.${doc}`;
}
