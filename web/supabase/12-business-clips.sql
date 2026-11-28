-- Step 12. Video clips in chat: record your camera or screen for up to 2 minutes and send it.
-- Run after 11-business-huddles.sql, in a new query. Safe to run again.
--
-- Adds:
--   1. The private shop-clips bucket. Each clip is at most 25 MB.
--   2. public.chat_clips: one row per clip, so each shop has a storage cap (300 MB to start).
--   3. chat_messages.attachment_kind: 'photo' or 'clip'.
--   4. Functions: reserve_clip() and shop_clip_usage().
--
-- Who sees what: clips follow their channel, like photos. Only the person who recorded a
-- clip, or an owner or admin, can delete it.

-- ---------- Settings ----------
-- clip_cap_mb: how much clip storage each shop gets. Change it with the service role.

alter table public.business_settings add column if not exists clip_cap_mb integer not null default 300;

-- ---------- 1. Bucket ----------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('shop-clips', 'shop-clips', false, 26214400, array['video/webm', 'video/mp4'])
on conflict (id) do nothing;

-- ---------- 2. Clips ----------

create table if not exists public.chat_clips (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  org_id uuid not null references public.shop_orgs(id) on delete cascade,
  channel_id uuid not null references public.chat_channels(id) on delete cascade,
  -- <org id>/<channel id>/<clip id>.<webm or mp4> in the shop-clips bucket.
  path text not null unique,
  bytes bigint not null check (bytes between 1 and 26214400),
  seconds integer not null check (seconds between 1 and 120),
  created_by uuid default auth.uid() references auth.users(id) on delete set null
);
create index if not exists chat_clips_org_idx on public.chat_clips (org_id);

-- ---------- 3. Messages carry the kind of attachment ----------

alter table public.chat_messages add column if not exists attachment_kind text
  check (attachment_kind is null or attachment_kind in ('photo', 'clip'));

-- ---------- Helpers ----------

-- True when the caller reserved this clip path and can still post in its channel.
create or replace function public.clip_reserved(path text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.chat_clips c
    where c.path = clip_reserved.path and c.created_by = auth.uid() and public.chat_can_read(c.channel_id)
  );
$$;

-- True when the caller recorded this clip, or is an owner or admin of its shop.
create or replace function public.clip_can_remove(path text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.chat_clips c
    where c.path = clip_can_remove.path and (c.created_by = auth.uid() or public.shop_can(c.org_id, 'admin'))
  );
$$;

revoke all on function public.clip_reserved(text), public.clip_can_remove(text) from public, anon;
grant execute on function public.clip_reserved(text), public.clip_can_remove(text) to authenticated;

-- The step 9 guard, plus: a clip must be reserved in the same channel, and the kind can't change.
create or replace function public.chat_messages_guard()
returns trigger
language plpgsql
as $$
declare
  v_channel record;
begin
  if tg_op = 'INSERT' then
    select * into v_channel from public.chat_channel_meta(new.channel_id);
    if v_channel.archived_at is not null then
      raise exception 'channel_archived';
    end if;
    new.org_id := v_channel.org_id;
    if public.is_client_request() then
      new.author_id := auth.uid();
      new.created_at := now();
      new.edited_at := null;
      new.deleted_at := null;
    end if;
    if new.attachment_path is null then
      new.attachment_kind := null;
    else
      new.attachment_kind := coalesce(new.attachment_kind, 'photo');
      if new.attachment_path not like new.org_id::text || '/' || new.channel_id::text || '/%' then
        raise exception 'bad_attachment';
      end if;
      if new.attachment_kind = 'clip' and not exists (
        select 1 from public.chat_clips c where c.path = new.attachment_path and c.channel_id = new.channel_id
      ) then
        raise exception 'bad_attachment';
      end if;
    end if;
    return new;
  end if;

  if public.is_client_request() then
    if new.channel_id <> old.channel_id or new.org_id <> old.org_id or new.author_id is distinct from old.author_id
       or new.created_at <> old.created_at or new.attachment_path is distinct from old.attachment_path
       or new.attachment_kind is distinct from old.attachment_kind then
      raise exception 'message_locked';
    end if;
    if old.deleted_at is not null then
      raise exception 'message_deleted';
    end if;
    if new.deleted_at is not null then
      new.body := null;
      new.deleted_at := now();
    elsif old.author_id is distinct from auth.uid() then
      raise exception 'not_yours';
    elsif new.body is distinct from old.body then
      new.edited_at := now();
    end if;
  end if;
  return new;
end;
$$;

-- When a message with a clip is deleted, the clip stops counting toward the shop's cap.
-- The browser removes the file itself first (Supabase doesn't allow it from SQL).
create or replace function public.chat_messages_free_clip()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.deleted_at is not null and old.deleted_at is null and old.attachment_kind = 'clip' then
    delete from public.chat_clips where path = old.attachment_path;
  end if;
  return new;
end;
$$;
drop trigger if exists chat_messages_free_clip on public.chat_messages;
create trigger chat_messages_free_clip after update on public.chat_messages
  for each row execute function public.chat_messages_free_clip();

-- ---------- Row level security ----------

alter table public.chat_clips enable row level security;

do $$ begin
  create policy chat_clips_read on public.chat_clips for select to authenticated
    using (public.chat_can_read(channel_id));
exception when duplicate_object then null; end $$;
do $$ begin
  create policy chat_clips_remove on public.chat_clips for delete to authenticated
    using (created_by = auth.uid() or public.shop_can(org_id, 'admin'));
exception when duplicate_object then null; end $$;

revoke all on public.chat_clips from anon;
grant select, delete on public.chat_clips to authenticated;

do $$ begin
  create policy shop_clips_insert on storage.objects for insert to authenticated
    with check (bucket_id = 'shop-clips' and public.clip_reserved(name));
exception when duplicate_object then null; end $$;
do $$ begin
  create policy shop_clips_read on storage.objects for select to authenticated
    using (bucket_id = 'shop-clips' and public.chat_can_read(public.chat_path_channel(name)));
exception when duplicate_object then null; end $$;
do $$ begin
  create policy shop_clips_delete on storage.objects for delete to authenticated
    using (bucket_id = 'shop-clips' and public.clip_can_remove(name));
exception when duplicate_object then null; end $$;

-- ---------- 4. Functions ----------

-- Saves room for one clip and returns where to upload it. Fails with clip_storage_full when
-- the shop is at its cap.
drop function if exists public.reserve_clip(uuid, bigint, integer, text);
create function public.reserve_clip(p_channel uuid, p_bytes bigint, p_seconds integer, p_ext text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
  v_archived timestamptz;
  v_cap bigint;
  v_used bigint;
  v_path text;
begin
  if not public.chat_can_read(p_channel) then
    raise exception 'not_allowed';
  end if;
  select org_id, archived_at into v_org, v_archived from public.chat_channels where id = p_channel;
  if v_archived is not null then
    raise exception 'channel_archived';
  end if;
  if p_ext not in ('webm', 'mp4') then
    raise exception 'bad_attachment';
  end if;
  if p_bytes is null or p_bytes < 1 or p_bytes > 26214400 then
    raise exception 'clip_too_big' using hint = 'A clip can be up to 25 MB.';
  end if;
  if p_seconds is null or p_seconds < 1 or p_seconds > 120 then
    raise exception 'clip_too_long' using hint = 'A clip can be up to 2 minutes.';
  end if;

  select coalesce(max(clip_cap_mb), 300)::bigint * 1048576 into v_cap from public.business_settings;
  -- One reservation at a time per shop, so two people can't both squeeze past the cap.
  perform 1 from public.shop_orgs where id = v_org for update;
  select coalesce(sum(bytes), 0) into v_used from public.chat_clips where org_id = v_org;
  if v_used + p_bytes > v_cap then
    raise exception 'clip_storage_full' using hint = 'Delete old clips to make room.';
  end if;

  v_path := v_org::text || '/' || p_channel::text || '/' || gen_random_uuid()::text || '.' || p_ext;
  insert into public.chat_clips (org_id, channel_id, path, bytes, seconds, created_by)
  values (v_org, p_channel, v_path, p_bytes, p_seconds, auth.uid());
  return v_path;
end;
$$;

-- How much clip storage the shop uses, and its cap. Anyone in the shop can see it.
drop function if exists public.shop_clip_usage(uuid);
create function public.shop_clip_usage(org uuid)
returns table (used_bytes bigint, cap_bytes bigint, clips integer)
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select sum(bytes) from public.chat_clips where org_id = org), 0)::bigint,
    (select coalesce(max(clip_cap_mb), 300)::bigint * 1048576 from public.business_settings),
    (select count(*)::int from public.chat_clips where org_id = org)
  where public.shop_role(org) is not null;
$$;

revoke all on function public.reserve_clip(uuid, bigint, integer, text), public.shop_clip_usage(uuid) from public, anon;
grant execute on function public.reserve_clip(uuid, bigint, integer, text), public.shop_clip_usage(uuid) to authenticated;

notify pgrst, 'reload schema';
