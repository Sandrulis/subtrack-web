-- Vienreizējs labojums: konti, kam izmēģinājumu piešķīra 109 RPC (pro_trial_started_at = now() pie pirmās pieslēgšanās).
-- Pēc 110_pro_trial_started_at_registration.sql (jaunie granti jau lieto created_at).

update public.users u
set
  pro_trial_started_at = u.created_at,
  updated_at = now()
where u.pro_trial_used = true
  and u.pro_trial_started_at is not null
  and u.created_at is not null
  and u.pro_trial_started_at > u.created_at + interval '5 minutes';
