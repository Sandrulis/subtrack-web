-- Partnera krāsa owner izdevumiem partnera panelī (atsevišķi no owner partner_display_color).
-- Papildina 088.

alter table public.family_sharing_links
add column if not exists partner_tint_color text not null default '#f59e0b';

alter table public.family_sharing_links
drop constraint if exists family_sharing_links_partner_tint_color_chk;

alter table public.family_sharing_links
add constraint family_sharing_links_partner_tint_color_chk check (
  partner_tint_color ~ '^#[0-9A-Fa-f]{3}([0-9A-Fa-f]{3})?$'
);

comment on column public.family_sharing_links.partner_display_color is
  'Krāsa, ko owner izvēlas partnera izdevumiem savā panelī.';

comment on column public.family_sharing_links.partner_tint_color is
  'Krāsa, ko partneris izvēlas owner izdevumiem savā panelī.';
