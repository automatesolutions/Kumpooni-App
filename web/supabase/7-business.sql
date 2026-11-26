-- Step 7. Business accounts for repair shops: shops, members, invites, and claims.
-- Run after 6-top-shops.sql, in a new query. Safe to run again.
--
-- Adds:
--   1. Helpers every policy uses: shop_role(), shop_can(), is_kumpooni_admin().
--   2. public.shop_orgs: a shop. Unverified until a claim is approved.
--   3. public.shop_members: who is in a shop, as owner, admin, member, or guest.
--   4. public.shop_invites: invite links. Only a SHA-256 of each token is stored.
--   5. public.shop_claims: proof that a shop is yours, and the review queue.
--   6. A private shop-claims storage bucket for DTI certificates.
--
-- Privacy:
--   - No consumer table changes here. Shops can't read any repair file.
--   - Google Places: place_id is the only Places value stored. Shop names and cities are
--     typed by the shop owner, never copied from Google.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------- 1a. Settings (service role only) ----------
-- claim_codes_sample: when true, claim codes are shown on screen instead of sent, and
-- anyone can verify their own shop. Turn it on only in a test project.

create table if not exists public.business_settings (
  id boolean primary key default true check (id),
  claim_codes_sample boolean not null default false
);
insert into public.business_settings (id) values (true) on conflict (id) do nothing;
alter table public.business_settings enable row level security;
revoke all on public.business_settings from anon, authenticated;

-- ---------- 2. Shops ----------

create table if not exists public.shop_orgs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  name text not null check (length(trim(name)) between 2 and 80),
  -- Google place id, the only Places value kept. Sample shops (sample-...) can't be claimed.
  place_id text unique check (place_id is null or (place_id !~ '^sample-' and length(place_id) between 10 and 300)),
  city text check (city is null or length(trim(city)) <= 80),
  categories text[] not null default '{}' check (
    cardinality(categories) between 1 and 10
    and categories <@ array[
      'car', 'motorcycle', 'home', 'construction', 'electrical', 'aircon', 'appliance', 'computer', 'phone', 'other'
    ]::text[]
  ),
  verification_status text not null default 'unverified'
    check (verification_status in ('unverified', 'pending', 'verified', 'rejected')),
  verified_at timestamptz,
  verified_method text check (verified_method in ('phone_code', 'email_code', 'dti_bn', 'manual', 'sample_code'))
);

drop trigger if exists shop_orgs_updated on public.shop_orgs;
create trigger shop_orgs_updated before update on public.shop_orgs
  for each row execute function public.set_updated_at();

-- ---------- 3. Members ----------

create table if not exists public.shop_members (
  org_id uuid not null references public.shop_orgs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'member', 'guest')),
  created_at timestamptz not null default now(),
  invited_by uuid references auth.users(id) on delete set null,
  primary key (org_id, user_id)
);
create index if not exists shop_members_user_idx on public.shop_members (user_id);

-- ---------- 1b. Helpers ----------
-- security definer so policies can ask about membership without RLS looping on itself.

create or replace function public.shop_role_rank(r text)
returns integer
language sql
immutable
as $$
  select case r when 'owner' then 4 when 'admin' then 3 when 'member' then 2 when 'guest' then 1 else 0 end;
$$;

-- The caller's role in a shop, or null.
create or replace function public.shop_role(org uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select m.role from public.shop_members m where m.org_id = org and m.user_id = auth.uid();
$$;

-- True when the caller's role is min_role or higher (owner > admin > member > guest).
create or replace function public.shop_can(org uuid, min_role text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.shop_role_rank(min_role) > 0
     and public.shop_role_rank(public.shop_role(org)) >= public.shop_role_rank(min_role);
$$;

-- Kumpooni staff who review claims. app_metadata can only be set with the service role.
create or replace function public.is_kumpooni_admin()
returns boolean
language sql
stable
as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role' = 'admin', false);
$$;

-- True when the request comes from the browser (anon or a signed-in person), not from a
-- security definer function or the service role.
create or replace function public.is_client_request()
returns boolean
language sql
stable
as $$
  select current_user in ('anon', 'authenticated');
$$;

revoke all on function public.shop_role(uuid), public.shop_can(uuid, text) from public;
grant execute on function public.shop_role(uuid), public.shop_can(uuid, text), public.shop_role_rank(text),
  public.is_kumpooni_admin() to authenticated;

-- ---------- Shop guards ----------

-- The browser can't verify a shop, change who made it, or move a shop with a claim open.
create or replace function public.shop_orgs_guard()
returns trigger
language plpgsql
as $$
begin
  if not public.is_client_request() then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.created_by := auth.uid();
    new.verification_status := 'unverified';
    new.verified_at := null;
    new.verified_method := null;
    return new;
  end if;
  if new.verification_status is distinct from old.verification_status
     or new.verified_at is distinct from old.verified_at
     or new.verified_method is distinct from old.verified_method
     or new.created_by is distinct from old.created_by then
    raise exception 'verification_locked' using hint = 'Only a claim review can change this.';
  end if;
  if new.place_id is distinct from old.place_id and old.verification_status in ('pending', 'verified') then
    raise exception 'place_locked' using hint = 'The Google place can''t change while a claim is open or approved.';
  end if;
  return new;
end;
$$;
drop trigger if exists shop_orgs_guard on public.shop_orgs;
create trigger shop_orgs_guard before insert or update on public.shop_orgs
  for each row execute function public.shop_orgs_guard();

-- The person who adds a shop becomes its owner.
create or replace function public.shop_orgs_add_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.created_by is not null then
    insert into public.shop_members (org_id, user_id, role)
    values (new.id, new.created_by, 'owner')
    on conflict (org_id, user_id) do update set role = 'owner';
  end if;
  return new;
end;
$$;
drop trigger if exists shop_orgs_add_owner on public.shop_orgs;
create trigger shop_orgs_add_owner after insert on public.shop_orgs
  for each row execute function public.shop_orgs_add_owner();

-- Member rules for browser requests:
--   - Nobody becomes owner here.
--   - Admins can't change or remove an owner.
--   - A shop always keeps at least one owner.
create or replace function public.shop_members_guard()
returns trigger
language plpgsql
as $$
declare
  v_owners integer;
begin
  if not public.is_client_request() then
    return coalesce(new, old);
  end if;
  if tg_op = 'INSERT' then
    raise exception 'use_invite' using hint = 'Members join with an invite link.';
  end if;
  if tg_op = 'UPDATE' then
    if new.org_id <> old.org_id or new.user_id <> old.user_id then
      raise exception 'member_locked';
    end if;
    if new.role = 'owner' and old.role <> 'owner' then
      raise exception 'owner_not_granted' using hint = 'Ownership can''t be given from the team page yet.';
    end if;
    if old.role = 'owner' and new.role <> 'owner' then
      raise exception 'owner_locked' using hint = 'An owner''s role can''t be changed here.';
    end if;
    return new;
  end if;
  -- DELETE
  if old.role = 'owner' then
    if not exists (select 1 from public.shop_orgs o where o.id = old.org_id) then
      return old; -- the shop itself is being deleted
    end if;
    if old.user_id <> auth.uid() then
      raise exception 'owner_locked' using hint = 'Only an owner can leave as owner.';
    end if;
    select count(*) into v_owners from public.shop_members m where m.org_id = old.org_id and m.role = 'owner';
    if v_owners <= 1 then
      raise exception 'last_owner' using hint = 'A shop needs at least one owner.';
    end if;
  end if;
  return old;
end;
$$;
drop trigger if exists shop_members_guard on public.shop_members;
create trigger shop_members_guard before insert or update or delete on public.shop_members
  for each row execute function public.shop_members_guard();

-- ---------- 4. Invites ----------

create table if not exists public.shop_invites (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  org_id uuid not null references public.shop_orgs(id) on delete cascade,
  email text not null check (email = lower(trim(email)) and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  role text not null check (role in ('admin', 'member', 'guest')),
  token_hash text not null unique,
  invited_by uuid default auth.uid() references auth.users(id) on delete set null,
  expires_at timestamptz not null default now() + interval '7 days',
  accepted_at timestamptz,
  accepted_by uuid references auth.users(id) on delete set null
);
create unique index if not exists shop_invites_open_idx on public.shop_invites (org_id, email)
  where accepted_at is null;

-- ---------- 5. Claims ----------

create table if not exists public.shop_claims (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  org_id uuid not null references public.shop_orgs(id) on delete cascade,
  -- Copied from the shop when the claim starts.
  place_id text,
  -- A place that another shop already holds. Only for manual review.
  disputed_place_id text,
  method text not null check (method in ('phone_code', 'email_code', 'dti_bn', 'manual')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'canceled')),
  dti_bn_number text check (dti_bn_number is null or dti_bn_number ~ '^[0-9]{5,12}$'),
  -- <org id>/<file> in the shop-claims bucket.
  document_path text,
  note text check (note is null or length(note) <= 1000),
  code_hash text,
  code_expires_at timestamptz,
  attempts smallint not null default 0,
  is_sample boolean not null default false,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  review_note text check (review_note is null or length(review_note) <= 1000),
  check (method <> 'dti_bn' or dti_bn_number is not null)
);
-- One open or approved claim per Google place, and one open claim per shop.
create unique index if not exists shop_claims_place_idx on public.shop_claims (place_id)
  where place_id is not null and status in ('pending', 'approved');
create unique index if not exists shop_claims_open_idx on public.shop_claims (org_id)
  where status = 'pending';
create index if not exists shop_claims_queue_idx on public.shop_claims (status, created_at)
  where status = 'pending';

-- ---------- Row level security ----------

alter table public.shop_orgs enable row level security;
alter table public.shop_members enable row level security;
alter table public.shop_invites enable row level security;
alter table public.shop_claims enable row level security;

do $$ begin
  create policy shop_orgs_read on public.shop_orgs for select to authenticated
    using (public.shop_role(id) is not null or public.is_kumpooni_admin());
exception when duplicate_object then null; end $$;
-- Shops are added with create_shop(), so the owner row exists before anything reads it back.
do $$ begin
  create policy shop_orgs_update on public.shop_orgs for update to authenticated
    using (public.shop_can(id, 'admin')) with check (public.shop_can(id, 'admin'));
exception when duplicate_object then null; end $$;
do $$ begin
  create policy shop_orgs_delete on public.shop_orgs for delete to authenticated
    using (public.shop_can(id, 'owner'));
exception when duplicate_object then null; end $$;

-- Members join only through accept_shop_invite(), so there is no insert policy.
do $$ begin
  create policy shop_members_read on public.shop_members for select to authenticated
    using (public.shop_role(org_id) is not null);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy shop_members_update on public.shop_members for update to authenticated
    using (public.shop_can(org_id, 'admin')) with check (public.shop_can(org_id, 'admin'));
exception when duplicate_object then null; end $$;
do $$ begin
  create policy shop_members_delete on public.shop_members for delete to authenticated
    using (public.shop_can(org_id, 'admin') or user_id = auth.uid());
exception when duplicate_object then null; end $$;

-- Invites are made with create_shop_invite(). Owners and admins see and cancel them.
do $$ begin
  create policy shop_invites_read on public.shop_invites for select to authenticated
    using (public.shop_can(org_id, 'admin'));
exception when duplicate_object then null; end $$;
do $$ begin
  create policy shop_invites_delete on public.shop_invites for delete to authenticated
    using (public.shop_can(org_id, 'admin'));
exception when duplicate_object then null; end $$;

-- Claims change only through the functions below.
do $$ begin
  create policy shop_claims_read on public.shop_claims for select to authenticated
    using (public.shop_can(org_id, 'admin') or public.is_kumpooni_admin());
exception when duplicate_object then null; end $$;

revoke all on public.shop_orgs, public.shop_members, public.shop_invites, public.shop_claims from anon;
grant select, update, delete on public.shop_orgs to authenticated;
grant select, update, delete on public.shop_members to authenticated;
grant select, delete on public.shop_invites to authenticated;
grant select on public.shop_claims to authenticated;
-- The code hash stays server side.
revoke select on public.shop_claims from authenticated;
grant select (id, created_at, org_id, place_id, disputed_place_id, method, status, dti_bn_number, document_path,
  note, code_expires_at, attempts, is_sample, created_by, reviewed_by, reviewed_at, review_note)
  on public.shop_claims to authenticated;
revoke select on public.shop_invites from authenticated;
grant select (id, created_at, org_id, email, role, invited_by, expires_at, accepted_at, accepted_by)
  on public.shop_invites to authenticated;

-- ---------- Shop functions ----------

-- Adds a shop. You become its owner. It stays unverified until a claim is approved.
drop function if exists public.create_shop(text, text, text[], text);
create function public.create_shop(p_name text, p_city text, p_categories text[], p_place_id text default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'not_signed_in';
  end if;
  if p_place_id is not null and exists (select 1 from public.shop_orgs where place_id = p_place_id) then
    raise exception 'place_taken' using hint = 'Another account already added this shop. Ask for a review if it''s yours.';
  end if;
  -- Ten shops per person is plenty for a chain and stops spam.
  if (select count(*) from public.shop_orgs where created_by = auth.uid()) >= 10 then
    raise exception 'too_many_shops';
  end if;
  insert into public.shop_orgs (name, city, categories, place_id, created_by)
  values (trim(p_name), nullif(trim(p_city), ''), p_categories, nullif(trim(p_place_id), ''), auth.uid())
  returning id into v_id;
  return v_id;
end;
$$;

-- ---------- Team functions ----------

-- Members with their email and name, for the team page. Members and up only.
drop function if exists public.shop_member_list(uuid);
create function public.shop_member_list(org uuid)
returns table (user_id uuid, role text, email text, name text, joined_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select m.user_id, m.role, u.email::text,
    coalesce(u.raw_user_meta_data ->> 'full_name',
      nullif(trim(concat_ws(' ', u.raw_user_meta_data ->> 'first_name', u.raw_user_meta_data ->> 'last_name')), '')),
    m.created_at
  from public.shop_members m
  join auth.users u on u.id = m.user_id
  where m.org_id = org and public.shop_can(org, 'member')
  order by public.shop_role_rank(m.role) desc, m.created_at;
$$;

-- Makes an invite and returns the raw token once. Owners and admins only.
drop function if exists public.create_shop_invite(uuid, text, text);
create function public.create_shop_invite(org uuid, p_email text, p_role text)
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_token text := encode(gen_random_bytes(24), 'hex');
  v_email text := lower(trim(p_email));
begin
  if not public.shop_can(org, 'admin') then
    raise exception 'not_allowed';
  end if;
  if p_role not in ('admin', 'member', 'guest') then
    raise exception 'bad_role';
  end if;
  if exists (
    select 1 from public.shop_members m join auth.users u on u.id = m.user_id
    where m.org_id = org and lower(u.email) = v_email
  ) then
    raise exception 'already_member' using hint = 'This person is already on the team.';
  end if;
  -- A new invite to the same email replaces the open one.
  delete from public.shop_invites where org_id = org and email = v_email and accepted_at is null;
  insert into public.shop_invites (org_id, email, role, token_hash, invited_by)
  values (org, v_email, p_role, encode(digest(v_token, 'sha256'), 'hex'), auth.uid());
  return v_token;
end;
$$;

-- What an invite link is for, so the invite page can say it before you join.
drop function if exists public.shop_invite_preview(text);
create function public.shop_invite_preview(token text)
returns jsonb
language sql
stable
security definer
set search_path = public, extensions
as $$
  select jsonb_build_object(
    'org_name', o.name,
    'role', i.role,
    'email', i.email,
    'expired', i.expires_at < now(),
    'accepted', i.accepted_at is not null
  )
  from public.shop_invites i
  join public.shop_orgs o on o.id = i.org_id
  where i.token_hash = encode(digest(token, 'sha256'), 'hex');
$$;

-- Joins the shop. Your confirmed sign-in email must match the invite.
drop function if exists public.accept_shop_invite(text);
create function public.accept_shop_invite(token text)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_invite public.shop_invites;
  v_email text;
begin
  select lower(u.email) into v_email from auth.users u
  where u.id = auth.uid() and u.email_confirmed_at is not null;

  select * into v_invite from public.shop_invites i
  where i.token_hash = encode(digest(token, 'sha256'), 'hex')
  for update;

  if v_invite.id is null or v_invite.accepted_at is not null then
    raise exception 'invite_not_found';
  end if;
  if v_invite.expires_at < now() then
    raise exception 'invite_expired';
  end if;
  if v_email is null or v_email <> v_invite.email then
    raise exception 'invite_wrong_email' using hint = 'Sign in with the email the invite was sent to.';
  end if;

  -- Joining never lowers a role you already have.
  insert into public.shop_members (org_id, user_id, role, invited_by)
  values (v_invite.org_id, auth.uid(), v_invite.role, v_invite.invited_by)
  on conflict (org_id, user_id) do update set role = excluded.role
    where public.shop_role_rank(excluded.role) > public.shop_role_rank(shop_members.role);

  update public.shop_invites set accepted_at = now(), accepted_by = auth.uid() where id = v_invite.id;
  return v_invite.org_id;
end;
$$;

-- ---------- Claim functions ----------

-- Starts a claim. For code methods it makes a 6-digit code. Live codes need SMS or email
-- sending, which is off until costs are approved, so they work in sample mode only.
-- Returns {claim_id, sample_code}. sample_code is null unless sample mode is on.
drop function if exists public.request_shop_claim(uuid, text, text, text, text, text);
create function public.request_shop_claim(
  org uuid,
  p_method text,
  p_bn text default null,
  p_document_path text default null,
  p_note text default null,
  p_disputed_place_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_org public.shop_orgs;
  v_sample boolean;
  v_code text;
  v_claim uuid;
begin
  if not public.shop_can(org, 'admin') then
    raise exception 'not_allowed';
  end if;
  select * into v_org from public.shop_orgs where id = org for update;
  if v_org.verification_status = 'verified' then
    raise exception 'already_verified';
  end if;
  if p_method not in ('phone_code', 'email_code', 'dti_bn', 'manual') then
    raise exception 'bad_method';
  end if;
  if p_disputed_place_id is not null and p_method not in ('dti_bn', 'manual') then
    raise exception 'dispute_needs_review' using hint = 'A shop someone else added is checked by a person.';
  end if;
  if p_document_path is not null and split_part(p_document_path, '/', 1) <> org::text then
    raise exception 'bad_document';
  end if;
  select claim_codes_sample into v_sample from public.business_settings where id;
  v_sample := coalesce(v_sample, false);

  if p_method in ('phone_code', 'email_code') then
    if v_org.place_id is null then
      raise exception 'needs_place' using hint = 'Codes go to the phone or email Google lists for your shop. Pick your shop on the map first.';
    end if;
    if not v_sample then
      raise exception 'live_codes_off' using hint = 'Codes aren''t sent yet. Use your DTI number or ask for a review.';
    end if;
    v_code := lpad(((('x' || encode(gen_random_bytes(4), 'hex'))::bit(32)::bigint) % 1000000)::text, 6, '0');
  end if;

  -- One open claim per shop: a new one replaces the last.
  update public.shop_claims set status = 'canceled' where org_id = org and status = 'pending';

  insert into public.shop_claims (
    org_id, place_id, disputed_place_id, method, dti_bn_number, document_path, note,
    code_hash, code_expires_at, is_sample, created_by
  ) values (
    org, v_org.place_id, nullif(trim(p_disputed_place_id), ''), p_method, nullif(trim(p_bn), ''), p_document_path,
    nullif(trim(p_note), ''),
    case when v_code is null then null else encode(digest(org::text || ':' || v_code, 'sha256'), 'hex') end,
    case when v_code is null then null else now() + interval '15 minutes' end,
    v_code is not null and v_sample,
    auth.uid()
  )
  returning id into v_claim;

  update public.shop_orgs set verification_status = 'pending' where id = org;
  return jsonb_build_object('claim_id', v_claim, 'sample_code', v_code);
end;
$$;

-- Checks a claim code. Returns 'approved', 'wrong_code', 'expired', or 'too_many'.
-- Wrong tries are counted, so it returns instead of raising.
drop function if exists public.verify_claim_code(uuid, text);
create function public.verify_claim_code(claim uuid, code text)
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_claim public.shop_claims;
begin
  select * into v_claim from public.shop_claims where id = claim for update;
  if v_claim.id is null or not public.shop_can(v_claim.org_id, 'admin') then
    raise exception 'not_allowed';
  end if;
  if v_claim.status <> 'pending' or v_claim.code_hash is null then
    raise exception 'not_a_code_claim';
  end if;
  if v_claim.attempts >= 5 then
    return 'too_many';
  end if;
  if v_claim.code_expires_at < now() then
    return 'expired';
  end if;
  if encode(digest(v_claim.org_id::text || ':' || trim(code), 'sha256'), 'hex') <> v_claim.code_hash then
    update public.shop_claims set attempts = attempts + 1 where id = claim;
    return 'wrong_code';
  end if;

  update public.shop_claims set status = 'approved', reviewed_at = now(), code_hash = null where id = claim;
  update public.shop_orgs set
    verification_status = 'verified',
    verified_at = now(),
    verified_method = case when v_claim.is_sample then 'sample_code' else v_claim.method end
  where id = v_claim.org_id;
  return 'approved';
end;
$$;

-- Kumpooni staff approve or reject a DTI or manual claim.
drop function if exists public.review_shop_claim(uuid, boolean, text);
create function public.review_shop_claim(claim uuid, approve boolean, p_note text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_claim public.shop_claims;
begin
  if not public.is_kumpooni_admin() then
    raise exception 'not_allowed';
  end if;
  select * into v_claim from public.shop_claims where id = claim for update;
  if v_claim.id is null or v_claim.status <> 'pending' then
    raise exception 'claim_not_open';
  end if;
  update public.shop_claims set
    status = case when approve then 'approved' else 'rejected' end,
    reviewed_by = auth.uid(),
    reviewed_at = now(),
    review_note = nullif(trim(p_note), ''),
    code_hash = null
  where id = claim;
  update public.shop_orgs set
    verification_status = case when approve then 'verified' else 'rejected' end,
    verified_at = case when approve then now() else null end,
    verified_method = case when approve then v_claim.method else null end
  where id = v_claim.org_id;
end;
$$;

-- The shop stops its own open claim.
drop function if exists public.cancel_shop_claim(uuid);
create function public.cancel_shop_claim(claim uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
begin
  select org_id into v_org from public.shop_claims where id = claim and status = 'pending';
  if v_org is null or not public.shop_can(v_org, 'admin') then
    raise exception 'not_allowed';
  end if;
  update public.shop_claims set status = 'canceled' where id = claim;
  update public.shop_orgs set verification_status = 'unverified' where id = v_org and verification_status = 'pending';
end;
$$;

-- Is this Google place already a Kumpooni shop? Only says yes or no, never which shop.
drop function if exists public.shop_place_taken(text);
create function public.shop_place_taken(p_place_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.shop_orgs where place_id = p_place_id);
$$;

revoke all on function
  public.create_shop(text, text, text[], text),
  public.shop_member_list(uuid),
  public.create_shop_invite(uuid, text, text),
  public.shop_invite_preview(text),
  public.accept_shop_invite(text),
  public.request_shop_claim(uuid, text, text, text, text, text),
  public.verify_claim_code(uuid, text),
  public.review_shop_claim(uuid, boolean, text),
  public.cancel_shop_claim(uuid),
  public.shop_place_taken(text)
from public, anon;
grant execute on function
  public.create_shop(text, text, text[], text),
  public.shop_member_list(uuid),
  public.create_shop_invite(uuid, text, text),
  public.shop_invite_preview(text),
  public.accept_shop_invite(text),
  public.request_shop_claim(uuid, text, text, text, text, text),
  public.verify_claim_code(uuid, text),
  public.review_shop_claim(uuid, boolean, text),
  public.cancel_shop_claim(uuid),
  public.shop_place_taken(text)
to authenticated;

-- ---------- 6. Storage: private DTI certificates ----------
-- Paths are <org id>/<file>. Owners and admins of that shop, and Kumpooni staff, can read them.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('shop-claims', 'shop-claims', false, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
on conflict (id) do nothing;

-- The shop id at the start of a storage path, or null when it isn't one.
create or replace function public.shop_path_org(path text)
returns uuid
language plpgsql
immutable
as $$
begin
  return split_part(path, '/', 1)::uuid;
exception when others then
  return null;
end;
$$;

do $$ begin
  create policy shop_claims_doc_insert on storage.objects for insert to authenticated
    with check (bucket_id = 'shop-claims' and public.shop_can(public.shop_path_org(name), 'admin'));
exception when duplicate_object then null; end $$;
do $$ begin
  create policy shop_claims_doc_read on storage.objects for select to authenticated
    using (bucket_id = 'shop-claims'
      and (public.shop_can(public.shop_path_org(name), 'admin') or public.is_kumpooni_admin()));
exception when duplicate_object then null; end $$;
do $$ begin
  create policy shop_claims_doc_delete on storage.objects for delete to authenticated
    using (bucket_id = 'shop-claims' and public.shop_can(public.shop_path_org(name), 'admin'));
exception when duplicate_object then null; end $$;

notify pgrst, 'reload schema';
