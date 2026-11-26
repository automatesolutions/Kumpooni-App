-- Step 8. The shop CRM: customers, leads, a pipeline, notes, follow-ups, and sharing a
-- repair file with a shop.
-- Run after 7-business.sql, in a new query. Safe to run again.
--
-- Adds:
--   1. public.pipeline_stages: each shop's stages. Seven defaults for every shop.
--   2. public.customers: the shop's customers.
--   3. public.file_shares: a consumer shares one repair file with one verified shop.
--   4. public.leads: one job or enquiry, on a stage.
--   5. public.lead_activities: the timeline. Stage, quote, and assignee changes are logged here.
--   6. public.follow_ups: reminders, including "after the warranty ends".
--   7. shared_file(): the only way a shop reads a repair file, and only what was ticked.
--
-- Privacy:
--   - No repair file policy changes. Shops still can't select repair_files, visits,
--     attachments, job_slips, or letters.
--   - A share is owned by the consumer. When they stop sharing, shared_file() returns
--     nothing and the shop's links to photos stop working.
--   - A shared customer's name and mobile are read live from the share, not copied.
--   - Guests see only leads assigned to them, and never a shared file.

-- ---------- 1. Pipeline stages ----------

create table if not exists public.pipeline_stages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  org_id uuid not null references public.shop_orgs(id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 40),
  position smallint not null,
  kind text not null default 'open' check (kind in ('open', 'won', 'lost')),
  unique (org_id, name)
);
create index if not exists pipeline_stages_org_idx on public.pipeline_stages (org_id, position);

create or replace function public.seed_pipeline(org uuid)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.pipeline_stages (org_id, name, position, kind)
  values
    (org, 'New', 1, 'open'),
    (org, 'Quoted', 2, 'open'),
    (org, 'Scheduled', 3, 'open'),
    (org, 'In the shop', 4, 'open'),
    (org, 'Ready for pickup', 5, 'open'),
    (org, 'Done', 6, 'won'),
    (org, 'Lost', 7, 'lost')
  on conflict (org_id, name) do nothing;
$$;
revoke all on function public.seed_pipeline(uuid) from public, anon, authenticated;

create or replace function public.shop_orgs_seed_pipeline()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.seed_pipeline(new.id);
  return new;
end;
$$;
drop trigger if exists shop_orgs_seed_pipeline on public.shop_orgs;
create trigger shop_orgs_seed_pipeline after insert on public.shop_orgs
  for each row execute function public.shop_orgs_seed_pipeline();

-- Shops made before this file get the defaults too.
select public.seed_pipeline(o.id)
from public.shop_orgs o
where not exists (select 1 from public.pipeline_stages s where s.org_id = o.id);

-- ---------- 2. Customers ----------

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  org_id uuid not null references public.shop_orgs(id) on delete cascade,
  -- Set only when the customer shared a repair file from Kumpooni.
  user_id uuid references auth.users(id) on delete set null,
  name text not null check (length(trim(name)) between 1 and 80),
  mobile text check (mobile is null or length(mobile) <= 30),
  email text check (email is null or length(email) <= 120),
  notes text check (notes is null or length(notes) <= 2000),
  source text not null default 'manual' check (source in ('share', 'shop_page', 'manual')),
  -- When and under which wording the customer agreed. Required for every customer.
  consent_at timestamptz not null default now(),
  consent_version text not null,
  created_by uuid default auth.uid() references auth.users(id) on delete set null
);
create unique index if not exists customers_user_idx on public.customers (org_id, user_id) where user_id is not null;
create index if not exists customers_org_idx on public.customers (org_id, name);

drop trigger if exists customers_updated on public.customers;
create trigger customers_updated before update on public.customers
  for each row execute function public.set_updated_at();

-- ---------- 3. Shares ----------

create table if not exists public.file_shares (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  file_id uuid not null references public.repair_files(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  org_id uuid not null references public.shop_orgs(id) on delete cascade,
  -- What the shop may see. problem is always shared: it's what a quote needs.
  fields text[] not null check (
    'problem' = any(fields)
    and fields <@ array['problem', 'item', 'plate', 'slip', 'photos', 'estimates', 'visits', 'contact']::text[]
  ),
  consent_version text not null,
  consented_at timestamptz not null default now(),
  revoked_at timestamptz
);
create unique index if not exists file_shares_active_idx on public.file_shares (file_id, org_id) where revoked_at is null;
create index if not exists file_shares_org_idx on public.file_shares (org_id) where revoked_at is null;

-- ---------- 4. Leads ----------

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  org_id uuid not null references public.shop_orgs(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  stage_id uuid not null references public.pipeline_stages(id),
  source text not null default 'manual' check (source in ('share', 'shop_page', 'manual')),
  kind text check (kind is null or kind in (
    'car', 'motorcycle', 'home', 'construction', 'electrical', 'aircon', 'appliance', 'computer', 'phone', 'other'
  )),
  title text not null check (length(trim(title)) between 1 and 120),
  quote_amount numeric check (quote_amount is null or quote_amount >= 0),
  assignee_id uuid references auth.users(id) on delete set null,
  share_id uuid references public.file_shares(id) on delete set null,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  closed_at timestamptz
);
create index if not exists leads_org_stage_idx on public.leads (org_id, stage_id, updated_at desc);
create index if not exists leads_customer_idx on public.leads (customer_id);
create index if not exists leads_assignee_idx on public.leads (assignee_id) where assignee_id is not null;

-- ---------- 5. Timeline ----------

create table if not exists public.lead_activities (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  org_id uuid not null references public.shop_orgs(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  actor_id uuid default auth.uid() references auth.users(id) on delete set null,
  type text not null check (type in ('created', 'stage', 'note', 'quote', 'assign', 'follow_up', 'share_revoked')),
  body text check (body is null or length(body) <= 2000),
  from_stage uuid references public.pipeline_stages(id) on delete set null,
  to_stage uuid references public.pipeline_stages(id) on delete set null
);
create index if not exists lead_activities_lead_idx on public.lead_activities (lead_id, created_at);

-- ---------- 6. Follow-ups ----------

create table if not exists public.follow_ups (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  org_id uuid not null references public.shop_orgs(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  due_on date not null,
  reason text not null default 'manual' check (reason in ('manual', 'warranty_end')),
  note text check (note is null or length(note) <= 500),
  assignee_id uuid references auth.users(id) on delete set null,
  done_at timestamptz,
  created_by uuid default auth.uid() references auth.users(id) on delete set null
);
create index if not exists follow_ups_due_idx on public.follow_ups (org_id, due_on) where done_at is null;

-- ---------- Helpers ----------

-- True for members and up, or for a guest when the lead is assigned to them.
create or replace function public.lead_visible(lead uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.leads l
    where l.id = lead
      and (public.shop_can(l.org_id, 'member')
        or (public.shop_role(l.org_id) = 'guest' and l.assignee_id = auth.uid()))
  );
$$;

-- A guest can see a customer only through a lead assigned to them.
create or replace function public.customer_visible_to_guest(customer uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.leads l
    where l.customer_id = customer and l.assignee_id = auth.uid() and public.shop_role(l.org_id) = 'guest'
  );
$$;

create or replace function public.shop_is_verified(org uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.shop_orgs where id = org and verification_status = 'verified');
$$;

revoke all on function public.lead_visible(uuid), public.customer_visible_to_guest(uuid), public.shop_is_verified(uuid)
  from public, anon;
grant execute on function public.lead_visible(uuid), public.customer_visible_to_guest(uuid), public.shop_is_verified(uuid)
  to authenticated;

-- ---------- Guards and logs ----------

-- What the browser may not change on a customer: who they are in Kumpooni, where they
-- came from, and their consent record.
create or replace function public.customers_guard()
returns trigger
language plpgsql
as $$
begin
  if not public.is_client_request() then
    return new;
  end if;
  if tg_op = 'INSERT' then
    if new.user_id is not null or new.source <> 'manual' then
      raise exception 'manual_only' using hint = 'Customers from Kumpooni are added when they share a repair.';
    end if;
    new.created_by := auth.uid();
    new.consent_at := now();
    return new;
  end if;
  if new.org_id <> old.org_id or new.user_id is distinct from old.user_id or new.source <> old.source
     or new.consent_at <> old.consent_at or new.consent_version <> old.consent_version then
    raise exception 'customer_locked';
  end if;
  return new;
end;
$$;
drop trigger if exists customers_guard on public.customers;
create trigger customers_guard before insert or update on public.customers
  for each row execute function public.customers_guard();

-- The consumer can only stop a share, never change what was shared or start it again.
create or replace function public.file_shares_guard()
returns trigger
language plpgsql
as $$
begin
  if not public.is_client_request() then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.user_id := auth.uid();
    new.consented_at := now();
    new.revoked_at := null;
    return new;
  end if;
  if new.file_id <> old.file_id or new.user_id <> old.user_id or new.org_id <> old.org_id
     or new.fields <> old.fields or new.consent_version <> old.consent_version
     or new.consented_at <> old.consented_at then
    raise exception 'share_locked' using hint = 'Stop this share and share again to change it.';
  end if;
  if old.revoked_at is not null and new.revoked_at is distinct from old.revoked_at then
    raise exception 'share_locked' using hint = 'Share again instead.';
  end if;
  return new;
end;
$$;
drop trigger if exists file_shares_guard on public.file_shares;
create trigger file_shares_guard before insert or update on public.file_shares
  for each row execute function public.file_shares_guard();

-- A new share becomes a customer (one per person per shop) and a lead in the first stage.
create or replace function public.file_shares_to_lead()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customer uuid;
  v_stage uuid;
  v_problem text;
  v_kind text;
  v_lead uuid;
begin
  select f.problem, v.kind into v_problem, v_kind
  from public.repair_files f left join public.vehicle v on v.id = f.vehicle_id
  where f.id = new.file_id;

  insert into public.customers (org_id, user_id, name, source, consent_at, consent_version, created_by)
  values (new.org_id, new.user_id, 'Kumpooni customer', 'share', new.consented_at, new.consent_version, null)
  on conflict (org_id, user_id) where user_id is not null
    do update set consent_at = excluded.consent_at, consent_version = excluded.consent_version
  returning id into v_customer;

  select id into v_stage from public.pipeline_stages
  where org_id = new.org_id and kind = 'open' order by position limit 1;

  insert into public.leads (org_id, customer_id, stage_id, source, kind, title, share_id, created_by)
  values (new.org_id, v_customer, v_stage, 'share', v_kind, left(coalesce(v_problem, 'Shared repair'), 120), new.id, null)
  returning id into v_lead;

  insert into public.lead_activities (org_id, lead_id, actor_id, type, body)
  values (new.org_id, v_lead, null, 'created', 'The customer shared a repair file from Kumpooni.');
  return new;
end;
$$;
drop trigger if exists file_shares_to_lead on public.file_shares;
create trigger file_shares_to_lead after insert on public.file_shares
  for each row execute function public.file_shares_to_lead();

create or replace function public.file_shares_log_revoke()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.revoked_at is null and new.revoked_at is not null then
    insert into public.lead_activities (org_id, lead_id, actor_id, type, body)
    select l.org_id, l.id, null, 'share_revoked', 'The customer stopped sharing their repair file.'
    from public.leads l where l.share_id = new.id;
  end if;
  return new;
end;
$$;
drop trigger if exists file_shares_log_revoke on public.file_shares;
create trigger file_shares_log_revoke after update on public.file_shares
  for each row execute function public.file_shares_log_revoke();

-- Leads: stage and assignee must belong to the same shop. The browser makes manual leads only.
create or replace function public.leads_guard()
returns trigger
language plpgsql
as $$
declare
  v_kind text;
begin
  if not exists (select 1 from public.pipeline_stages where id = new.stage_id and org_id = new.org_id) then
    raise exception 'bad_stage';
  end if;
  if not exists (select 1 from public.customers where id = new.customer_id and org_id = new.org_id) then
    raise exception 'bad_customer';
  end if;
  if new.assignee_id is not null
     and not exists (select 1 from public.shop_members where org_id = new.org_id and user_id = new.assignee_id) then
    raise exception 'bad_assignee' using hint = 'Assign the job to someone on the team.';
  end if;
  if public.is_client_request() then
    if tg_op = 'INSERT' then
      if new.source <> 'manual' or new.share_id is not null then
        raise exception 'manual_only';
      end if;
      new.created_by := auth.uid();
    elsif new.org_id <> old.org_id or new.source <> old.source or new.share_id is distinct from old.share_id
       or new.customer_id <> old.customer_id then
      raise exception 'lead_locked';
    end if;
  end if;
  if tg_op = 'UPDATE' then
    new.updated_at := now();
  end if;
  select kind into v_kind from public.pipeline_stages where id = new.stage_id;
  new.closed_at := case when v_kind = 'open' then null
                        when tg_op = 'UPDATE' and old.closed_at is not null and old.stage_id = new.stage_id then old.closed_at
                        else now() end;
  return new;
end;
$$;
drop trigger if exists leads_guard on public.leads;
create trigger leads_guard before insert or update on public.leads
  for each row execute function public.leads_guard();

-- Every stage, quote, and assignee change is written to the timeline here, not by the browser.
create or replace function public.leads_log()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if new.source = 'manual' then
      insert into public.lead_activities (org_id, lead_id, actor_id, type, body, to_stage)
      values (new.org_id, new.id, auth.uid(), 'created', 'Added by the shop.', new.stage_id);
    end if;
    return new;
  end if;
  if new.stage_id <> old.stage_id then
    insert into public.lead_activities (org_id, lead_id, actor_id, type, from_stage, to_stage)
    values (new.org_id, new.id, auth.uid(), 'stage', old.stage_id, new.stage_id);
  end if;
  if new.quote_amount is distinct from old.quote_amount then
    insert into public.lead_activities (org_id, lead_id, actor_id, type, body)
    values (new.org_id, new.id, auth.uid(), 'quote', coalesce(new.quote_amount::text, ''));
  end if;
  if new.assignee_id is distinct from old.assignee_id then
    insert into public.lead_activities (org_id, lead_id, actor_id, type, body)
    values (new.org_id, new.id, auth.uid(), 'assign', new.assignee_id::text);
  end if;
  return new;
end;
$$;
drop trigger if exists leads_log on public.leads;
create trigger leads_log after insert or update on public.leads
  for each row execute function public.leads_log();

-- Notes from the browser: always the signed-in person, always on a lead in the same shop.
create or replace function public.lead_activities_guard()
returns trigger
language plpgsql
as $$
begin
  if public.is_client_request() then
    if new.type <> 'note' then
      raise exception 'notes_only';
    end if;
    new.actor_id := auth.uid();
  end if;
  select l.org_id into new.org_id from public.leads l where l.id = new.lead_id;
  return new;
end;
$$;
drop trigger if exists lead_activities_guard on public.lead_activities;
create trigger lead_activities_guard before insert on public.lead_activities
  for each row execute function public.lead_activities_guard();

create or replace function public.follow_ups_guard()
returns trigger
language plpgsql
as $$
begin
  select l.org_id into new.org_id from public.leads l where l.id = new.lead_id;
  if new.assignee_id is not null
     and not exists (select 1 from public.shop_members where org_id = new.org_id and user_id = new.assignee_id) then
    raise exception 'bad_assignee';
  end if;
  if tg_op = 'INSERT' then
    if public.is_client_request() then
      new.created_by := auth.uid();
    end if;
  elsif new.lead_id <> old.lead_id then
    raise exception 'follow_up_locked';
  end if;
  return new;
end;
$$;
drop trigger if exists follow_ups_guard on public.follow_ups;
create trigger follow_ups_guard before insert or update on public.follow_ups
  for each row execute function public.follow_ups_guard();

create or replace function public.follow_ups_log()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.lead_activities (org_id, lead_id, actor_id, type, body)
  values (new.org_id, new.lead_id, auth.uid(), 'follow_up',
    to_char(new.due_on, 'YYYY-MM-DD') || case when new.reason = 'warranty_end' then ' (warranty)' else '' end);
  return new;
end;
$$;
drop trigger if exists follow_ups_log on public.follow_ups;
create trigger follow_ups_log after insert on public.follow_ups
  for each row execute function public.follow_ups_log();

-- ---------- Row level security ----------

alter table public.pipeline_stages enable row level security;
alter table public.customers enable row level security;
alter table public.file_shares enable row level security;
alter table public.leads enable row level security;
alter table public.lead_activities enable row level security;
alter table public.follow_ups enable row level security;

-- Stages: everyone in the shop reads them (guests need the names). Owners and admins edit.
do $$ begin
  create policy pipeline_stages_read on public.pipeline_stages for select to authenticated
    using (public.shop_role(org_id) is not null);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy pipeline_stages_write on public.pipeline_stages for all to authenticated
    using (public.shop_can(org_id, 'admin')) with check (public.shop_can(org_id, 'admin'));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy customers_read on public.customers for select to authenticated
    using (public.shop_can(org_id, 'member') or public.customer_visible_to_guest(id));
exception when duplicate_object then null; end $$;
do $$ begin
  create policy customers_insert on public.customers for insert to authenticated
    with check (public.shop_can(org_id, 'member'));
exception when duplicate_object then null; end $$;
do $$ begin
  create policy customers_update on public.customers for update to authenticated
    using (public.shop_can(org_id, 'member')) with check (public.shop_can(org_id, 'member'));
exception when duplicate_object then null; end $$;
do $$ begin
  create policy customers_delete on public.customers for delete to authenticated
    using (public.shop_can(org_id, 'admin'));
exception when duplicate_object then null; end $$;

-- Shares: the consumer owns them. Shop members see that a share exists, not the file.
do $$ begin
  create policy file_shares_own on public.file_shares for select to authenticated
    using (user_id = auth.uid() or public.shop_can(org_id, 'member'));
exception when duplicate_object then null; end $$;
do $$ begin
  create policy file_shares_insert on public.file_shares for insert to authenticated
    with check (user_id = auth.uid() and public.owns_repair_file(file_id) and public.shop_is_verified(org_id));
exception when duplicate_object then null; end $$;
do $$ begin
  create policy file_shares_stop on public.file_shares for update to authenticated
    using (user_id = auth.uid()) with check (user_id = auth.uid());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy leads_read on public.leads for select to authenticated
    using (public.shop_can(org_id, 'member') or (public.shop_role(org_id) = 'guest' and assignee_id = auth.uid()));
exception when duplicate_object then null; end $$;
do $$ begin
  create policy leads_insert on public.leads for insert to authenticated
    with check (public.shop_can(org_id, 'member'));
exception when duplicate_object then null; end $$;
do $$ begin
  create policy leads_update on public.leads for update to authenticated
    using (public.shop_can(org_id, 'member')) with check (public.shop_can(org_id, 'member'));
exception when duplicate_object then null; end $$;
do $$ begin
  create policy leads_delete on public.leads for delete to authenticated
    using (public.shop_can(org_id, 'admin'));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy lead_activities_read on public.lead_activities for select to authenticated
    using (public.lead_visible(lead_id));
exception when duplicate_object then null; end $$;
do $$ begin
  create policy lead_activities_note on public.lead_activities for insert to authenticated
    with check (type = 'note' and public.shop_can(org_id, 'member'));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy follow_ups_read on public.follow_ups for select to authenticated
    using (public.lead_visible(lead_id));
exception when duplicate_object then null; end $$;
do $$ begin
  create policy follow_ups_write on public.follow_ups for all to authenticated
    using (public.shop_can(org_id, 'member')) with check (public.shop_can(org_id, 'member'));
exception when duplicate_object then null; end $$;

revoke all on public.pipeline_stages, public.customers, public.file_shares, public.leads,
  public.lead_activities, public.follow_ups from anon;
grant select, insert, update, delete on public.pipeline_stages, public.customers, public.leads,
  public.follow_ups to authenticated;
grant select, insert, update on public.file_shares to authenticated;
grant select, insert on public.lead_activities to authenticated;

-- ---------- 7. Reading a shared file ----------

-- What one share shows, live. Members and up of the shop, or the consumer themselves
-- (for "See what the shop sees"). Null once the share is stopped, and for anyone else.
drop function if exists public.shared_file(uuid);
create function public.shared_file(p_share uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  s public.file_shares;
  f public.repair_files;
  v public.vehicle;
  slip public.job_slips;
  u public.users;
  v_out jsonb;
begin
  select * into s from public.file_shares where id = p_share;
  if s.id is null or s.revoked_at is not null then
    return null;
  end if;
  if not (public.shop_can(s.org_id, 'member') or s.user_id = auth.uid()) then
    return null;
  end if;
  select * into f from public.repair_files where id = s.file_id;
  select * into v from public.vehicle where id = f.vehicle_id;
  select * into slip from public.job_slips where file_id = f.id;

  v_out := jsonb_build_object(
    'share_id', s.id,
    'fields', to_jsonb(s.fields),
    'shared_at', s.consented_at,
    'problem', f.problem,
    'started_at', f.started_at,
    'status', f.status,
    'kind', v.kind
  );
  if 'item' = any(s.fields) and v.id is not null then
    v_out := v_out || jsonb_build_object('item', jsonb_build_object(
      'make', coalesce((select name from public.brand where id = v.brand_id), v.make_text),
      'model', coalesce((select name from public.model where id = v.model_id), v.model_text),
      'year', v.year_model));
  end if;
  if 'plate' = any(s.fields) and v.id is not null then
    v_out := v_out || jsonb_build_object('plate', jsonb_build_object('plate_no', v.plate_no, 'vin_last6', v.vin_last6));
  end if;
  if 'slip' = any(s.fields) and slip.id is not null then
    v_out := v_out || jsonb_build_object('slip', jsonb_build_object(
      'job_text', slip.job_text, 'peso_cap', slip.peso_cap, 'dropoff_at', slip.dropoff_at, 'extras', slip.extras));
  end if;
  if 'photos' = any(s.fields) then
    v_out := v_out || jsonb_build_object('photos', coalesce((
      select jsonb_agg(jsonb_build_object('path', a.storage_path, 'caption', a.caption) order by a.created_at)
      from public.attachments a where a.file_id = f.id and a.kind = 'before_photo'), '[]'::jsonb));
  end if;
  if 'estimates' = any(s.fields) then
    v_out := v_out || jsonb_build_object('estimates', coalesce((
      select jsonb_agg(jsonb_build_object('path', a.storage_path, 'kind', a.kind, 'caption', a.caption) order by a.created_at)
      from public.attachments a where a.file_id = f.id and a.kind in ('estimate', 'job_order')), '[]'::jsonb));
  end if;
  if 'visits' = any(s.fields) then
    v_out := v_out || jsonb_build_object('visits', coalesce((
      select jsonb_agg(jsonb_build_object(
        'date_in', x.date_in, 'date_out', x.date_out, 'result', x.result,
        'amount_paid', x.amount_paid, 'shop_said', x.shop_said, 'story', x.story) order by x.date_in)
      from public.visits x where x.file_id = f.id), '[]'::jsonb));
  end if;
  if 'contact' = any(s.fields) then
    select * into u from public.users where id = s.user_id;
    v_out := v_out || jsonb_build_object('contact', jsonb_build_object(
      'name', coalesce(nullif(slip.owner_name, ''), nullif(u.full_name, ''),
        nullif(trim(concat_ws(' ', u.first_name, u.last_name)), '')),
      'mobile', coalesce(nullif(slip.owner_mobile, ''), u.phone)));
  end if;
  return v_out;
end;
$$;

-- For the storage policy: a photo or estimate in an active share, for its shop's members.
create or replace function public.can_read_shared_object(path text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.attachments a
    join public.file_shares s on s.file_id = a.file_id and s.revoked_at is null
    where a.storage_path = path
      and public.shop_can(s.org_id, 'member')
      and ((a.kind = 'before_photo' and 'photos' = any(s.fields))
        or (a.kind in ('estimate', 'job_order') and 'estimates' = any(s.fields)))
  );
$$;

do $$ begin
  create policy repair_proof_shared_read on storage.objects for select to authenticated
    using (bucket_id = 'repair-proof' and public.can_read_shared_object(name));
exception when duplicate_object then null; end $$;

-- The verified shop on a Google place, so a repair file can offer "Send to this shop".
drop function if exists public.verified_shop_for_place(text);
create function public.verified_shop_for_place(p_place_id text)
returns table (id uuid, name text, city text)
language sql
stable
security definer
set search_path = public
as $$
  select o.id, o.name, o.city from public.shop_orgs o
  where o.place_id = p_place_id and o.verification_status = 'verified';
$$;

-- The shops one of your files is shared with, with their names.
drop function if exists public.my_file_shares(uuid);
create function public.my_file_shares(p_file uuid)
returns table (id uuid, org_id uuid, org_name text, fields text[], consented_at timestamptz, revoked_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select s.id, s.org_id, o.name, s.fields, s.consented_at, s.revoked_at
  from public.file_shares s join public.shop_orgs o on o.id = s.org_id
  where s.file_id = p_file and s.user_id = auth.uid()
  order by s.consented_at desc;
$$;

revoke all on function
  public.shared_file(uuid),
  public.can_read_shared_object(text),
  public.verified_shop_for_place(text),
  public.my_file_shares(uuid)
from public, anon;
grant execute on function
  public.shared_file(uuid),
  public.can_read_shared_object(text),
  public.verified_shop_for_place(text),
  public.my_file_shares(uuid)
to authenticated;

notify pgrst, 'reload schema';
