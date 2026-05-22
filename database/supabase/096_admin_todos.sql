-- Admin Kanban uzdevumi (/admin/todos): trīs kolonnas, prioritāte, pabeigti pazūd pēc 8 h.
-- Palaid pēc current_user_is_admin() (003/023).

create table if not exists public.admin_todos (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  priority text not null default 'medium',
  status text not null default 'todo',
  sort_order integer not null default 0,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint admin_todos_title_trim_chk check (
    title = btrim(title) and char_length(title) between 1 and 200
  ),
  constraint admin_todos_description_len_chk check (char_length(description) <= 4000),
  constraint admin_todos_priority_chk check (priority in ('low', 'medium', 'high')),
  constraint admin_todos_status_chk check (status in ('todo', 'in_progress', 'done')),
  constraint admin_todos_sort_order_chk check (sort_order >= 0)
);

comment on table public.admin_todos is
  'Admin Kanban uzdevumi: todo | in_progress | done; pabeigti dzēsti pēc 8 h no completed_at.';

drop trigger if exists admin_todos_set_updated_at on public.admin_todos;
create trigger admin_todos_set_updated_at
before update on public.admin_todos for each row
execute function public.set_updated_at();

create index if not exists admin_todos_status_sort_idx
  on public.admin_todos (status, sort_order asc, updated_at desc);

create index if not exists admin_todos_done_completed_idx
  on public.admin_todos (completed_at)
  where status = 'done';

alter table public.admin_todos enable row level security;

drop policy if exists "admin_todos_select_admin" on public.admin_todos;
create policy "admin_todos_select_admin"
  on public.admin_todos for select
  to authenticated
  using (public.current_user_is_admin());

drop policy if exists "admin_todos_insert_admin" on public.admin_todos;
create policy "admin_todos_insert_admin"
  on public.admin_todos for insert
  to authenticated
  with check (public.current_user_is_admin());

drop policy if exists "admin_todos_update_admin" on public.admin_todos;
create policy "admin_todos_update_admin"
  on public.admin_todos for update
  to authenticated
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

drop policy if exists "admin_todos_delete_admin" on public.admin_todos;
create policy "admin_todos_delete_admin"
  on public.admin_todos for delete
  to authenticated
  using (public.current_user_is_admin());
