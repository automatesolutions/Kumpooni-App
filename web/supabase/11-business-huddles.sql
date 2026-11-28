-- Step 11. Huddles: voice and camera calls in a chat channel, for up to 4 people.
-- Run after 10-business-tasks.sql, in a new query. Safe to run again.
--
-- Calls go straight between browsers (WebRTC). Kumpooni never carries or records the sound
-- or video. The database only passes the short setup messages each browser needs to find
-- the others, and keeps the list of who is in each call.
--
-- Adds:
--   1. public.huddles: one call in one channel. A channel has at most one call going.
--   2. public.huddle_people: who is in the call. Someone who stops checking in for 45
--      seconds (a closed tab, a lost signal) counts as gone.
--   3. public.huddle_signals: setup messages from one person to another, sent through Realtime.
--      Old ones are cleared as new ones arrive.
--   4. Functions: join_huddle(), leave_huddle(), huddle_ping(), and shop_huddles().
--
-- Who sees what: the same people who can read the channel (chat_can_read in step 9).
-- Setup messages are readable only by the person they're for and the person who sent them.

-- ---------- 1. Calls ----------

create table if not exists public.huddles (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.shop_orgs(id) on delete cascade,
  channel_id uuid not null references public.chat_channels(id) on delete cascade,
  started_by uuid references auth.users(id) on delete set null,
  started_at timestamptz not null default now(),
  ended_at timestamptz
);
create unique index if not exists huddles_live_idx on public.huddles (channel_id) where ended_at is null;
create index if not exists huddles_org_idx on public.huddles (org_id) where ended_at is null;

-- ---------- 2. People in a call ----------

create table if not exists public.huddle_people (
  huddle_id uuid not null references public.huddles(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  org_id uuid not null references public.shop_orgs(id) on delete cascade,
  joined_at timestamptz not null default now(),
  seen_at timestamptz not null default now(),
  left_at timestamptz,
  primary key (huddle_id, user_id)
);

-- ---------- 3. Setup messages ----------

create table if not exists public.huddle_signals (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  huddle_id uuid not null references public.huddles(id) on delete cascade,
  org_id uuid not null references public.shop_orgs(id) on delete cascade,
  from_user uuid not null default auth.uid() references auth.users(id) on delete cascade,
  to_user uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('offer', 'answer', 'ice', 'state')),
  payload jsonb not null check (octet_length(payload::text) <= 16384)
);
create index if not exists huddle_signals_to_idx on public.huddle_signals (to_user, huddle_id);

-- ---------- Helpers ----------

-- True when the person is in the call and has checked in within 45 seconds.
create or replace function public.huddle_active(p_huddle uuid, p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.huddle_people p
    join public.huddles h on h.id = p.huddle_id
    where p.huddle_id = p_huddle and p.user_id = p_user and p.left_at is null
      and p.seen_at > now() - interval '45 seconds' and h.ended_at is null
  );
$$;

-- True when the caller can read the call's channel.
create or replace function public.huddle_visible(p_huddle uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.huddles h where h.id = p_huddle and public.chat_can_read(h.channel_id));
$$;

revoke all on function public.huddle_active(uuid, uuid), public.huddle_visible(uuid) from public, anon;
grant execute on function public.huddle_active(uuid, uuid), public.huddle_visible(uuid) to authenticated;

-- Fills in the sender and shop, and checks both people are in the call right now.
create or replace function public.huddle_signals_guard()
returns trigger
language plpgsql
as $$
begin
  if public.is_client_request() then
    new.from_user := auth.uid();
    new.created_at := now();
  end if;
  select org_id into new.org_id from public.huddles where id = new.huddle_id;
  if not public.huddle_active(new.huddle_id, new.from_user) then
    raise exception 'not_in_huddle';
  end if;
  if new.to_user = new.from_user or not exists (
    select 1 from public.huddle_people where huddle_id = new.huddle_id and user_id = new.to_user and left_at is null
  ) then
    raise exception 'not_in_huddle';
  end if;
  return new;
end;
$$;
drop trigger if exists huddle_signals_guard on public.huddle_signals;
create trigger huddle_signals_guard before insert on public.huddle_signals
  for each row execute function public.huddle_signals_guard();

-- Setup messages are only needed for a few seconds. Each new one clears those older than 10 minutes.
create or replace function public.huddle_signals_sweep()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.huddle_signals where created_at < now() - interval '10 minutes';
  return null;
end;
$$;
drop trigger if exists huddle_signals_sweep on public.huddle_signals;
create trigger huddle_signals_sweep after insert on public.huddle_signals
  for each statement execute function public.huddle_signals_sweep();

-- ---------- Row level security ----------
-- Calls and their people change only through the functions below.

alter table public.huddles enable row level security;
alter table public.huddle_people enable row level security;
alter table public.huddle_signals enable row level security;

do $$ begin
  create policy huddles_read on public.huddles for select to authenticated
    using (public.chat_can_read(channel_id));
exception when duplicate_object then null; end $$;
do $$ begin
  create policy huddle_people_read on public.huddle_people for select to authenticated
    using (public.huddle_visible(huddle_id));
exception when duplicate_object then null; end $$;
do $$ begin
  create policy huddle_signals_read on public.huddle_signals for select to authenticated
    using (to_user = auth.uid() or from_user = auth.uid());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy huddle_signals_send on public.huddle_signals for insert to authenticated
    with check (from_user = auth.uid() and public.huddle_visible(huddle_id));
exception when duplicate_object then null; end $$;

revoke all on public.huddles, public.huddle_people, public.huddle_signals from anon;
grant select on public.huddles, public.huddle_people to authenticated;
grant select, insert on public.huddle_signals to authenticated;

do $$ begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.huddle_signals;
  end if;
exception when duplicate_object then null; end $$;
do $$ begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.huddle_people;
  end if;
exception when duplicate_object then null; end $$;

-- ---------- 4. Functions ----------

-- Joins the call in a channel, starting one if none is going. Returns the call id and the
-- people already in it, so the new person can call each of them.
drop function if exists public.join_huddle(uuid);
create function public.join_huddle(p_channel uuid)
returns table (huddle_id uuid, others uuid[])
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  v_me uuid := auth.uid();
  v_org uuid;
  v_archived timestamptz;
  v_id uuid;
  v_others uuid[];
begin
  if not public.chat_can_read(p_channel) then
    raise exception 'not_allowed';
  end if;
  select c.org_id, c.archived_at into v_org, v_archived from public.chat_channels c where c.id = p_channel;
  if v_archived is not null then
    raise exception 'channel_archived';
  end if;

  select h.id into v_id from public.huddles h where h.channel_id = p_channel and h.ended_at is null for update;
  -- A call where nobody has checked in for 45 seconds is over.
  if v_id is not null and not exists (
    select 1 from public.huddle_people p
    where p.huddle_id = v_id and p.left_at is null and p.seen_at > now() - interval '45 seconds'
  ) then
    update public.huddles set ended_at = now() where id = v_id;
    v_id := null;
  end if;
  if v_id is null then
    insert into public.huddles (org_id, channel_id, started_by) values (v_org, p_channel, v_me)
    on conflict do nothing
    returning id into v_id;
    if v_id is null then
      select h.id into v_id from public.huddles h where h.channel_id = p_channel and h.ended_at is null;
    end if;
  end if;

  -- People who stopped checking in have left.
  update public.huddle_people set left_at = now()
  where huddle_people.huddle_id = v_id and left_at is null and seen_at <= now() - interval '45 seconds';

  select coalesce(array_agg(p.user_id order by p.joined_at), '{}') into v_others
  from public.huddle_people p
  where p.huddle_id = v_id and p.left_at is null and p.user_id <> v_me;
  if cardinality(v_others) >= 4 then
    raise exception 'huddle_full' using hint = 'A huddle has room for 4 people.';
  end if;

  insert into public.huddle_people (huddle_id, user_id, org_id) values (v_id, v_me, v_org)
  on conflict on constraint huddle_people_pkey do update set joined_at = now(), seen_at = now(), left_at = null;
  return query select v_id, v_others;
end;
$$;

-- Leaves the call. The call ends when the last person leaves.
drop function if exists public.leave_huddle(uuid);
create function public.leave_huddle(p_huddle uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.huddle_people set left_at = now()
  where huddle_id = p_huddle and user_id = auth.uid() and left_at is null;
  if not exists (
    select 1 from public.huddle_people
    where huddle_id = p_huddle and left_at is null and seen_at > now() - interval '45 seconds'
  ) then
    update public.huddles set ended_at = now() where id = p_huddle and ended_at is null;
  end if;
end;
$$;

-- Says "I'm still here" every 15 seconds. Returns false when the call is over for you.
drop function if exists public.huddle_ping(uuid);
create function public.huddle_ping(p_huddle uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.huddle_visible(p_huddle) then
    return false;
  end if;
  update public.huddle_people set seen_at = now()
  where huddle_id = p_huddle and user_id = auth.uid() and left_at is null;
  return found;
end;
$$;

-- Calls going on in a shop that the caller can see, with who is in each.
drop function if exists public.shop_huddles(uuid);
create function public.shop_huddles(org uuid)
returns table (huddle_id uuid, channel_id uuid, started_at timestamptz, people uuid[])
language sql
stable
security definer
set search_path = public
as $$
  select h.id, h.channel_id, h.started_at, array_agg(p.user_id order by p.joined_at)
  from public.huddles h
  join public.huddle_people p on p.huddle_id = h.id and p.left_at is null and p.seen_at > now() - interval '45 seconds'
  where h.org_id = org and h.ended_at is null and public.chat_can_read(h.channel_id)
  group by h.id;
$$;

revoke all on function
  public.join_huddle(uuid), public.leave_huddle(uuid), public.huddle_ping(uuid), public.shop_huddles(uuid)
from public, anon;
grant execute on function
  public.join_huddle(uuid), public.leave_huddle(uuid), public.huddle_ping(uuid), public.shop_huddles(uuid)
to authenticated;

notify pgrst, 'reload schema';
