-- Family sharing: stingrāka owner RLS + BEFORE UPDATE guards (status/partner_id/krāsas).
-- Papildina 084–091.

drop policy if exists "family_sharing_links_update_owner" on public.family_sharing_links;

drop policy if exists "family_sharing_links_update_owner_revoke" on public.family_sharing_links;
create policy "family_sharing_links_update_owner_revoke"
on public.family_sharing_links for update
using (
  owner_user_id = auth.uid ()
  and status in ('pending', 'active')
)
with
  check (
    owner_user_id = auth.uid ()
    and status = 'revoked'
  );

drop policy if exists "family_sharing_links_update_owner_pending" on public.family_sharing_links;
create policy "family_sharing_links_update_owner_pending"
on public.family_sharing_links for update
using (
  owner_user_id = auth.uid ()
  and status = 'pending'
)
with
  check (
    owner_user_id = auth.uid ()
    and status = 'pending'
  );

drop policy if exists "family_sharing_links_update_owner_active" on public.family_sharing_links;
create policy "family_sharing_links_update_owner_active"
on public.family_sharing_links for update
using (
  owner_user_id = auth.uid ()
  and status = 'active'
)
with
  check (
    owner_user_id = auth.uid ()
    and status = 'active'
  );

create or replace function public.family_sharing_links_guard_update ()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  uid uuid := auth.uid ();
  invitee_email_match boolean;
begin
  if uid is null then
    return new;
  end if;

  if new.id is distinct from old.id then
    raise exception 'family_sharing_links: id change forbidden';
  end if;
  if new.owner_user_id is distinct from old.owner_user_id then
    raise exception 'family_sharing_links: owner change forbidden';
  end if;
  if new.invite_email is distinct from old.invite_email then
    raise exception 'family_sharing_links: invite_email change forbidden';
  end if;
  if new.created_at is distinct from old.created_at then
    raise exception 'family_sharing_links: created_at change forbidden';
  end if;

  invitee_email_match := lower(old.invite_email) = (
    select lower(u.email)
    from public.users u
    where u.id = uid
  );

  if new.partner_user_id is distinct from old.partner_user_id then
    if not (
      old.status = 'pending'
      and new.status = 'active'
      and new.partner_user_id = uid
    ) then
      raise exception 'family_sharing_links: partner_user_id change forbidden';
    end if;
  end if;

  if new.accepted_at is distinct from old.accepted_at then
    if not (
      old.status = 'pending'
      and new.status = 'active'
      and new.partner_user_id = uid
    ) then
      raise exception 'family_sharing_links: accepted_at change forbidden';
    end if;
  end if;

  if new.status is distinct from old.status then
    if old.owner_user_id = uid and new.status = 'revoked' and old.status in ('pending', 'active') then
      null;
    elsif old.partner_user_id = uid and new.status = 'revoked' and old.status = 'active' then
      null;
    elsif
      old.status = 'pending'
      and new.status = 'revoked'
      and (
        old.partner_user_id = uid
        or (old.partner_user_id is null and invitee_email_match)
      )
    then
      null;
    elsif old.status = 'pending' and new.status = 'active' and new.partner_user_id = uid then
      null;
    else
      raise exception 'family_sharing_links: status change forbidden';
    end if;
  else
    if old.owner_user_id = uid then
      if old.status = 'pending' then
        if new.partner_tint_color is distinct from old.partner_tint_color
          or new.accepted_at is distinct from old.accepted_at
        then
          raise exception 'family_sharing_links: owner pending field forbidden';
        end if;
      elsif old.status = 'active' then
        if new.partner_tint_color is distinct from old.partner_tint_color
          or new.accepted_at is distinct from old.accepted_at
          or new.partner_user_id is distinct from old.partner_user_id
        then
          raise exception 'family_sharing_links: owner active field forbidden';
        end if;
      else
        raise exception 'family_sharing_links: owner update forbidden';
      end if;
    elsif old.partner_user_id = uid and old.status = 'active' and new.status = 'active' then
      if new.partner_display_color is distinct from old.partner_display_color
        or new.accepted_at is distinct from old.accepted_at
        or new.partner_user_id is distinct from old.partner_user_id
      then
        raise exception 'family_sharing_links: partner active field forbidden';
      end if;
    elsif old.status = 'pending' and (
      old.partner_user_id = uid
      or (old.partner_user_id is null and invitee_email_match)
    ) then
      if new.partner_display_color is distinct from old.partner_display_color
        or new.combine_in_totals is distinct from old.combine_in_totals
        or new.partner_tint_color is distinct from old.partner_tint_color
      then
        raise exception 'family_sharing_links: pending invitee meta forbidden';
      end if;
    else
      raise exception 'family_sharing_links: update forbidden';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists family_sharing_links_guard_update on public.family_sharing_links;
create trigger family_sharing_links_guard_update
before update on public.family_sharing_links for each row
execute function public.family_sharing_links_guard_update ();

insert into public.site_translations (translation_key, locale, value)
values
  ('family_sharing.err_invite_failed', 'lv', 'Uzaicinājumu neizdevās nosūtīt. Pārbaudi e-pastu un mēģini vēlreiz.'),
  ('family_sharing.err_invite_failed', 'en', 'Could not send the invite. Check the email and try again.'),
  ('family_sharing.err_invite_failed', 'fr', 'Impossible d''envoyer l''invitation. Vérifiez l''e-mail et réessayez.'),
  ('family_sharing.err_invite_failed', 'de', 'Einladung konnte nicht gesendet werden. E-Mail prüfen und erneut versuchen.'),
  ('family_sharing.err_invite_failed', 'es', 'No se pudo enviar la invitación. Comprueba el correo e inténtalo de nuevo.'),
  ('family_sharing.err_invite_failed', 'pt', 'Não foi possível enviar o convite. Verifique o e-mail e tente novamente.'),
  ('family_sharing.err_invite_failed', 'ru', 'Не удалось отправить приглашение. Проверьте почту и повторите попытку.')
on conflict (translation_key, locale) do update set
  value = excluded.value,
  updated_at = now();
