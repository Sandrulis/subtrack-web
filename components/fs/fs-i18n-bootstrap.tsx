/**
 * Pirms /fs/*.js ielādēšanas nodod frāzes un meta kā JSON zem `<template>`.
 * React 19 neizpilda `<script>` mezglus klientā; `hydrateFsI18nFromTemplate()`
 * (`load-fs-scripts.tsx`) uzstāda `window.__SUBTRACK_*` pirmajā `loadScriptOnce`.
 */
export function FsI18nBootstrap({
  phrases,
  intlLocale,
}: {
  phrases: Record<string, string>;
  intlLocale: string;
}) {
  const payloadJson = JSON.stringify({
    phrases,
    meta: { intlLocale: intlLocale.trim() || "lv-LV" },
  }).replace(/</g, "\\u003c");
  return (
    <template
      id="subtrack-fs-i18n-bootstrap"
      dangerouslySetInnerHTML={{ __html: payloadJson }}
    />
  );
}
