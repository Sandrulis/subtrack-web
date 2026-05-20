## Apraksts

<!-- Īsi: kas mainīts un kāpēc -->

## Drošība (L2 – aizpildi pēc būtiskām izmaiņām)

- [ ] Jaunas/mainītas DB tabulas: RLS `WITH CHECK` aizsargā privileged kolonnas (paraugs: `015_users_rls_protect_privileged_columns.sql`)
- [ ] Jaunas Server Actions (admin/mutācijas): `requireAdminUser()` vai ekvivalents
- [ ] Jauni `app/api/*`: sesija `getUser()` + `user_id` / admin RPC; bez `service_role` klientā
- [ ] E-pasta šabloni: `system_settings_email_templates` (admin), ne `email_templates` uz `system_settings`
- [ ] Nav `NEXT_PUBLIC_*` ar service role; ENV tikai serverī
- [ ] FS `innerHTML`: tikai ar `escHtml` / `escAttr`, ja teksts no lietotāja vai DB
- [ ] `npm run security:check` lokāli (vai CI zaļš)

## Test plāns

<!-- Kā pārbaudīji -->
