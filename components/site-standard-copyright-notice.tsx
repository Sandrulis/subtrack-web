"use client";

import { useSubtrackIntl } from "@/components/subtrack-intl-provider";

/** Kājnes standarta formulējums („Visi tiesības aizsargātas.") ar dinamisko zīmolu no DB */
export function SiteStandardCopyrightNotice() {
  const year = new Date().getFullYear();
  const { systemSiteName, t } = useSubtrackIntl();
  return (
    <p>
      &copy; {year} {systemSiteName}. {t("admin.footer.rights_reserved")}
    </p>
  );
}
