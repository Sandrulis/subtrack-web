-- Sākotnēja kārtība pēc created_at (vecie ieraksti varēja būt ar sort_order = 0).
with ranked as (
  select
    id,
    row_number() over (partition by status order by created_at asc) - 1 as new_order
  from public.admin_todos
  where status in ('todo', 'in_progress', 'done')
)
update public.admin_todos t
set sort_order = r.new_order
from ranked r
where t.id = r.id;
