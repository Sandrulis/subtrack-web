import { FsI18nBootstrap } from "@/components/fs/fs-i18n-bootstrap";
import { fsNotifyBarPhraseKeys } from "@/lib/fs/fs-page-i18n-keys";
import {
  getUiPhrasesForRequest,
  resolveRequestUiLocales,
} from "@/lib/ui/server-ui-phrases";
import { uiLocaleCodeToBcp47ForIntl } from "@/lib/ui/ui-locale-from-request";

/**
 * Uz lapām ar NavDash / NavLanding, kur nav pilnā `FsI18nBootstrap` (paneļa / analītikas),
 * nodrošina `window.__SUBTRACK_FS_META.intlLocale` un kavējuma etiķetes `FsT`, lai
 * paziņojumu panelis nesajauktu UI lokāli ar fiksētu lv-LV fallback.
 */
export async function FsNotifyI18nBootstrap() {
  const { locale } = await resolveRequestUiLocales();
  const intlLocale = uiLocaleCodeToBcp47ForIntl(locale);
  const phrases = await getUiPhrasesForRequest(fsNotifyBarPhraseKeys());
  return <FsI18nBootstrap phrases={phrases} intlLocale={intlLocale} />;
}
