-- Admin e-pasta dizains: apraksts par visām valodām

INSERT INTO public.site_translations (translation_key, locale, value)
VALUES
  (
    'admin.email_design.lead',
    'lv',
    'Priekšskatiet un pielāgojiet e-pastus visās programmas valodās (en, fr, de, es, pt, lv, ru). Noklusējuma teksti ir gatavi katrā valodā; pēc saglabāšanas Auth šablonus iekopē Supabase.'
  ),
  (
    'admin.email_design.lead',
    'en',
    'Preview and edit emails in all app languages (en, fr, de, es, pt, lv, ru). Defaults exist for each language; after saving, paste Auth templates into Supabase.'
  ),
  (
    'admin.email_design.lead',
    'fr',
    'Prévisualisez et modifiez les e-mails dans toutes les langues (en, fr, de, es, pt, lv, ru). Textes par défaut prêts ; après enregistrement, collez les modèles Auth dans Supabase.'
  ),
  (
    'admin.email_design.lead',
    'de',
    'E-Mails in allen App-Sprachen (en, fr, de, es, pt, lv, ru) ansehen und anpassen. Standardtexte sind vorhanden; nach dem Speichern Auth-Vorlagen in Supabase einfügen.'
  ),
  (
    'admin.email_design.lead',
    'es',
    'Previsualiza y edita correos en todos los idiomas (en, fr, de, es, pt, lv, ru). Textos por defecto listos; tras guardar, pega plantillas Auth en Supabase.'
  ),
  (
    'admin.email_design.lead',
    'pt',
    'Pré-visualize e edite emails em todos os idiomas (en, fr, de, es, pt, lv, ru). Textos predefinidos prontos; após guardar, cole modelos Auth no Supabase.'
  ),
  (
    'admin.email_design.lead',
    'ru',
    'Просматривайте и редактируйте письма на всех языках приложения (en, fr, de, es, pt, lv, ru). Тексты по умолчанию готовы; после сохранения вставьте шаблоны в Supabase.'
  )
ON CONFLICT (translation_key, locale)
DO UPDATE SET
  value = excluded.value,
  updated_at = now();
