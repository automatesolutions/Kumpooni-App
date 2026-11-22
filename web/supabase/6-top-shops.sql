-- Step 6. Top shops nearby (/nearby).
-- Run after 4-more-repairs.sql, in a new query. Safe to run again.
-- (5-vehicle-log.sql is reserved for the vehicle log. This step does not need it.)
--
-- Adds:
--   1. public.nearby_cache: one row per search area, written only by the nearby-shops function.
--   2. repair_files.shop_place_id: set when a file is started from /nearby, so it matches the shop exactly.
--   3. public.my_shop_proof(): the signed-in person's own repair facts, per file, for the Proof Score.
--   4. nearby_usage, nearby_visitor_usage and nearby_take_call(): limits on live Google searches.

-- ---------- 1. Search cache ----------
-- Key: kind:latCell:lngCell:bucket. latCell and lngCell are lat and lng rounded to a 0.02° grid
-- (about 2.2 km). bucket is the slider radius rounded up to 5, 10, 15 or 25 km.
--
-- What may be stored follows Google's Places policies: place ids may be kept, and coordinates
-- for up to 30 days. Names, ratings, hours and phone numbers from Google are not stored here.
-- payload holds Kumpooni's own sample shops only, and the check below enforces that.

create table if not exists public.nearby_cache (
  cache_key text primary key,
  kind text not null check (kind in (
    'car', 'motorcycle', 'home', 'construction', 'electrical', 'aircon', 'appliance', 'computer', 'phone'
  )),
  lat_cell integer not null,
  lng_cell integer not null,
  radius_bucket smallint not null check (radius_bucket in (5, 10, 15, 25)),
  center_lat double precision not null,
  center_lng double precision not null,
  fetch_radius_km numeric not null,
  source text not null check (source in ('sample', 'places')),
  -- Google place ids (or sample ids), in the order the search returned them.
  place_ids text[] not null default '{}',
  -- [{id, lat, lng}]. Google allows coordinates for up to 30 days; the function deletes older rows.
  place_points jsonb not null default '[]'::jsonb,
  -- Sample shops only. Never Google content.
  payload jsonb,
  -- Attribution lines the page must show with this data.
  attributions jsonb not null default '[]'::jsonb,
  fetched_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '24 hours',
  constraint nearby_cache_payload_sample_only check (source = 'sample' or payload is null)
);
create index if not exists nearby_cache_fetched_idx on public.nearby_cache (fetched_at);

-- Row level security on, and no policies: the browser can neither read nor write the cache.
-- The nearby-shops function uses the service role, which skips RLS.
alter table public.nearby_cache enable row level security;
revoke all on public.nearby_cache from anon, authenticated;

-- ---------- 2. Place id on repair files ----------
-- Nullable. Older files keep shop_name and shop_city and are matched by name. No backfill.

alter table public.repair_files add column if not exists shop_place_id text;
create index if not exists repair_files_place_idx on public.repair_files (user_id, shop_place_id)
  where shop_place_id is not null;

-- ---------- 3. Your own repair facts, per file ----------
-- Runs as the caller (security invoker), so RLS limits it to their own files.
-- Returns facts, not names of people, plates or problems.

drop function if exists public.my_shop_proof();
create function public.my_shop_proof()
returns table (
  file_id uuid,
  shop_name text,
  shop_city text,
  shop_place_id text,
  kind text,
  has_estimate boolean,
  has_slip boolean,
  price_limit numeric,
  total_paid numeric,
  paid_visits integer,
  has_letter boolean
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    f.id,
    f.shop_name,
    f.shop_city,
    f.shop_place_id,
    v.kind,
    exists (select 1 from public.attachments a where a.file_id = f.id and a.kind in ('estimate', 'job_order')),
    exists (select 1 from public.job_slips s where s.file_id = f.id),
    coalesce((select s.peso_cap from public.job_slips s where s.file_id = f.id), f.peso_cap),
    (select sum(x.amount_paid) from public.visits x where x.file_id = f.id),
    (select count(*) from public.visits x where x.file_id = f.id and x.amount_paid is not null)::integer,
    exists (select 1 from public.letters l where l.file_id = f.id)
  from public.repair_files f
  left join public.vehicle v on v.id = f.vehicle_id
  where f.user_id = auth.uid();
$$;

revoke all on function public.my_shop_proof() from public, anon;
grant execute on function public.my_shop_proof() to authenticated;

-- ---------- 4. Limits on live Google searches ----------
-- Every live search costs money after Google's free amount, so the nearby-shops function
-- asks here first. It gets 'ok', 'month_cap' (this month's limit is used up) or
-- 'visitor_cap' (one visitor searched too often this hour).
-- Visitors are stored as a one-way hash, never an IP address, and their rows are deleted
-- after a day. Only the function (service role) can call this.

create table if not exists public.nearby_usage (
  month date primary key,          -- first day of the month, Asia/Manila
  calls integer not null default 0
);
alter table public.nearby_usage enable row level security;
revoke all on public.nearby_usage from anon, authenticated;

create table if not exists public.nearby_visitor_usage (
  visitor text not null,           -- sha-256 hash, not an IP
  hour timestamptz not null,
  calls integer not null default 0,
  primary key (visitor, hour)
);
alter table public.nearby_visitor_usage enable row level security;
revoke all on public.nearby_visitor_usage from anon, authenticated;

drop function if exists public.nearby_take_call(text, integer, integer);
create function public.nearby_take_call(p_visitor text, p_month_cap integer, p_hour_cap integer)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_month date := date_trunc('month', now() at time zone 'Asia/Manila')::date;
  v_hour timestamptz := date_trunc('hour', now());
  v_calls integer;
begin
  -- One visitor, one hour.
  insert into nearby_visitor_usage as u (visitor, hour, calls) values (p_visitor, v_hour, 1)
  on conflict (visitor, hour) do update set calls = u.calls + 1
  returning calls into v_calls;
  if v_calls > p_hour_cap then
    return 'visitor_cap';
  end if;

  -- The whole site, one month. The row is locked while it is checked, so two searches
  -- at the same moment can't both take the last free one.
  insert into nearby_usage (month, calls) values (v_month, 0) on conflict (month) do nothing;
  update nearby_usage set calls = calls + 1
   where month = v_month and calls < p_month_cap
  returning calls into v_calls;
  if v_calls is null then
    return 'month_cap';
  end if;

  delete from nearby_visitor_usage where hour < now() - interval '1 day';
  return 'ok';
end;
$$;

revoke all on function public.nearby_take_call(text, integer, integer) from public, anon, authenticated;
grant execute on function public.nearby_take_call(text, integer, integer) to service_role;
