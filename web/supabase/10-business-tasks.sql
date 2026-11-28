-- Step 10. Tasks for shops: a board with To do, Doing, and Done.
-- Run after 9-business-chat.sql, in a new query. Safe to run again.
--
-- Adds:
--   1. public.shop_tasks: one task, with who does it, when it's due, and an optional lead.
--   2. Live updates through Realtime, so the board changes on every open screen.
--
-- Who sees what:
--   - Members, admins, and owners see and change every task in the shop.
--   - Guests see only tasks given to them, and can only move them between columns.
--   - Owners, admins, and the person who made a task can delete it.

-- ---------- 1. Tasks ----------

create table if not exists public.shop_tasks (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  org_id uuid not null references public.shop_orgs(id) on delete cascade,
  title text not null check (length(trim(title)) between 1 and 200),
  notes text check (notes is null or length(notes) <= 4000),
  status text not null default 'todo' check (status in ('todo', 'doing', 'done')),
  -- Order inside a column. Smaller comes first.
  position double precision not null default extract(epoch from now()),
  assignee_id uuid references auth.users(id) on delete set null,
  due_on date,
  lead_id uuid references public.leads(id) on delete set null,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  done_at timestamptz
);
create index if not exists shop_tasks_org_idx on public.shop_tasks (org_id, status, position);
create index if not exists shop_tasks_assignee_idx on public.shop_tasks (assignee_id) where assignee_id is not null;
create index if not exists shop_tasks_lead_idx on public.shop_tasks (lead_id) where lead_id is not null;

-- ---------- Guard ----------

-- Keeps the shop, the maker, and the dates right, checks the assignee and lead, and lets a
-- guest change only the column and the order.
create or replace function public.shop_tasks_guard()
returns trigger
language plpgsql
as $$
declare
  v_lead_org uuid;
begin
  if tg_op = 'UPDATE' and public.is_client_request() then
    if new.org_id <> old.org_id or new.created_by is distinct from old.created_by or new.created_at <> old.created_at then
      raise exception 'task_locked';
    end if;
    if not public.shop_can(old.org_id, 'member')
       and (new.title <> old.title or new.notes is distinct from old.notes
         or new.assignee_id is distinct from old.assignee_id or new.due_on is distinct from old.due_on
         or new.lead_id is distinct from old.lead_id) then
      raise exception 'guest_status_only' using hint = 'Guests can move their tasks, not change them.';
    end if;
  end if;

  if tg_op = 'INSERT' and public.is_client_request() then
    new.created_by := auth.uid();
    new.created_at := now();
    new.done_at := null;
  end if;

  if new.assignee_id is not null and (tg_op = 'INSERT' or new.assignee_id is distinct from old.assignee_id)
     and not exists (select 1 from public.shop_members where org_id = new.org_id and user_id = new.assignee_id) then
    raise exception 'not_in_shop' using hint = 'Give the task to someone in the shop.';
  end if;

  if new.lead_id is not null and (tg_op = 'INSERT' or new.lead_id is distinct from old.lead_id) then
    select org_id into v_lead_org from public.leads where id = new.lead_id;
    if v_lead_org is distinct from new.org_id then
      raise exception 'bad_lead';
    end if;
  end if;

  if new.status = 'done' and (tg_op = 'INSERT' or old.status <> 'done') then
    new.done_at := now();
  elsif new.status <> 'done' then
    new.done_at := null;
  end if;
  new.updated_at := now();
  return new;
end;
$$;
drop trigger if exists shop_tasks_guard on public.shop_tasks;
create trigger shop_tasks_guard before insert or update on public.shop_tasks
  for each row execute function public.shop_tasks_guard();

-- ---------- Row level security ----------

alter table public.shop_tasks enable row level security;

do $$ begin
  create policy shop_tasks_read on public.shop_tasks for select to authenticated
    using (public.shop_can(org_id, 'member')
      or (public.shop_role(org_id) = 'guest' and assignee_id = auth.uid()));
exception when duplicate_object then null; end $$;
do $$ begin
  create policy shop_tasks_add on public.shop_tasks for insert to authenticated
    with check (public.shop_can(org_id, 'member'));
exception when duplicate_object then null; end $$;
do $$ begin
  create policy shop_tasks_change on public.shop_tasks for update to authenticated
    using (public.shop_can(org_id, 'member')
      or (public.shop_role(org_id) = 'guest' and assignee_id = auth.uid()))
    with check (public.shop_can(org_id, 'member')
      or (public.shop_role(org_id) = 'guest' and assignee_id = auth.uid()));
exception when duplicate_object then null; end $$;
do $$ begin
  create policy shop_tasks_remove on public.shop_tasks for delete to authenticated
    using (public.shop_can(org_id, 'admin') or (created_by = auth.uid() and public.shop_can(org_id, 'member')));
exception when duplicate_object then null; end $$;

revoke all on public.shop_tasks from anon;
grant select, insert, update, delete on public.shop_tasks to authenticated;

-- ---------- 2. Live updates ----------

do $$ begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.shop_tasks;
  end if;
exception when duplicate_object then null; end $$;

notify pgrst, 'reload schema';
