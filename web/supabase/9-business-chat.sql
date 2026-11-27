-- Step 9. Team chat for shops: channels, direct messages, and a chat on every lead.
-- Run after 8-business-crm.sql, in a new query. Safe to run again.
--
-- Adds:
--   1. public.chat_channels: #general and other channels, direct messages, and lead chats.
--   2. public.chat_members: who is in a private channel or a direct message.
--   3. public.chat_messages: the messages. New ones reach open screens through Realtime.
--   4. public.chat_reads: when each person last read each channel, for unread counts.
--   5. Functions: my_chat_channels(), chat_people(), open_dm(), lead_chat(),
--      create_chat_channel(), and mark_chat_read().
--   6. The private shop-chat bucket for photos in messages.
--
-- Who sees what:
--   - Public channels: members, admins, and owners of the shop. Guests only when added.
--   - Private channels and direct messages: only the people in them.
--   - Lead chats: the same people who can see the lead (guests only when it's assigned to them).
--   - Anyone who leaves the shop loses every channel at once.

-- ---------- 1. Channels ----------

create table if not exists public.chat_channels (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  org_id uuid not null references public.shop_orgs(id) on delete cascade,
  kind text not null check (kind in ('channel', 'dm', 'lead')),
  name text check (name is null or name ~ '^[a-z0-9][a-z0-9-]{0,39}$'),
  topic text check (topic is null or length(topic) <= 200),
  is_private boolean not null default false,
  lead_id uuid references public.leads(id) on delete cascade,
  -- Two user ids in order, so one pair has one direct message.
  dm_key text,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  archived_at timestamptz,
  last_message_at timestamptz,
  check ((kind = 'channel') = (name is not null)),
  check ((kind = 'lead') = (lead_id is not null)),
  check ((kind = 'dm') = (dm_key is not null)),
  check (kind = 'channel' or not is_private)
);
create unique index if not exists chat_channels_name_idx on public.chat_channels (org_id, name) where kind = 'channel';
create unique index if not exists chat_channels_lead_idx on public.chat_channels (lead_id) where kind = 'lead';
create unique index if not exists chat_channels_dm_idx on public.chat_channels (org_id, dm_key) where kind = 'dm';

-- ---------- 2. Members of private channels and direct messages ----------

create table if not exists public.chat_members (
  channel_id uuid not null references public.chat_channels(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  org_id uuid not null references public.shop_orgs(id) on delete cascade,
  added_at timestamptz not null default now(),
  added_by uuid default auth.uid() references auth.users(id) on delete set null,
  primary key (channel_id, user_id)
);
create index if not exists chat_members_user_idx on public.chat_members (user_id, org_id);

-- ---------- 3. Messages ----------

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  channel_id uuid not null references public.chat_channels(id) on delete cascade,
  org_id uuid not null references public.shop_orgs(id) on delete cascade,
  author_id uuid default auth.uid() references auth.users(id) on delete set null,
  body text check (body is null or length(body) <= 4000),
  -- <org id>/<channel id>/<file> in the shop-chat bucket.
  attachment_path text,
  edited_at timestamptz,
  deleted_at timestamptz,
  check (deleted_at is not null or length(trim(coalesce(body, ''))) > 0 or attachment_path is not null)
);
create index if not exists chat_messages_channel_idx on public.chat_messages (channel_id, created_at desc);

-- ---------- 4. Read markers ----------

create table if not exists public.chat_reads (
  channel_id uuid not null references public.chat_channels(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (channel_id, user_id)
);

-- ---------- Helpers ----------

-- True when the caller can read this channel. See "Who sees what" above.
create or replace function public.chat_can_read(channel uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.chat_channels c
    where c.id = channel
      and public.shop_role(c.org_id) is not null
      and (
        (c.kind = 'channel' and not c.is_private and public.shop_can(c.org_id, 'member'))
        or (c.kind = 'lead' and public.lead_visible(c.lead_id))
        or (c.kind in ('channel', 'dm')
          and exists (select 1 from public.chat_members m where m.channel_id = c.id and m.user_id = auth.uid()))
      )
  );
$$;

-- The channel id in a shop-chat storage path, or null when it isn't one.
create or replace function public.chat_path_channel(path text)
returns uuid
language plpgsql
immutable
as $$
begin
  return split_part(path, '/', 2)::uuid;
exception when others then
  return null;
end;
$$;

-- True when the person is in the shop. Only answers for people in that shop themselves.
create or replace function public.shop_has_member(org uuid, p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.shop_role(org) is not null
     and exists (select 1 from public.shop_members where org_id = org and user_id = p_user);
$$;
revoke all on function public.shop_has_member(uuid, uuid) from public, anon;
grant execute on function public.shop_has_member(uuid, uuid) to authenticated;

-- A channel's shop, kind, and archive time, read past RLS. The guards use it, so a
-- request for a channel the caller can't see fails on the policies, with a clear error.
create or replace function public.chat_channel_meta(channel uuid)
returns table (org_id uuid, kind text, archived_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select c.org_id, c.kind, c.archived_at from public.chat_channels c where c.id = channel;
$$;

create or replace function public.chat_channel_org(channel uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select c.org_id from public.chat_channels c where c.id = channel;
$$;

revoke all on function public.chat_can_read(uuid), public.chat_channel_meta(uuid), public.chat_channel_org(uuid)
  from public, anon;
grant execute on function public.chat_can_read(uuid), public.chat_path_channel(text), public.chat_channel_meta(uuid),
  public.chat_channel_org(uuid) to authenticated;

-- Every shop gets #general.
create or replace function public.seed_chat(org uuid)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.chat_channels (org_id, kind, name, topic, created_by)
  values (org, 'channel', 'general', 'Everyone in the shop', null)
  on conflict do nothing;
$$;
revoke all on function public.seed_chat(uuid) from public, anon, authenticated;

create or replace function public.shop_orgs_seed_chat()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.seed_chat(new.id);
  return new;
end;
$$;
drop trigger if exists shop_orgs_seed_chat on public.shop_orgs;
create trigger shop_orgs_seed_chat after insert on public.shop_orgs
  for each row execute function public.shop_orgs_seed_chat();

-- Shops made before this file get #general too.
select public.seed_chat(id) from public.shop_orgs;

-- ---------- Guards ----------

-- The browser can rename, set the topic, or archive a channel. Nothing else.
create or replace function public.chat_channels_guard()
returns trigger
language plpgsql
as $$
begin
  if public.is_client_request() then
    if tg_op = 'INSERT' then
      raise exception 'use_rpc';
    end if;
    if new.org_id <> old.org_id or new.kind <> old.kind or new.is_private <> old.is_private
       or new.lead_id is distinct from old.lead_id or new.dm_key is distinct from old.dm_key
       or new.created_by is distinct from old.created_by or new.last_message_at is distinct from old.last_message_at then
      raise exception 'channel_locked';
    end if;
    if old.kind = 'channel' and old.name = 'general' and (new.name <> 'general' or new.archived_at is not null) then
      raise exception 'general_locked' using hint = 'Everyone uses #general, so it stays.';
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists chat_channels_guard on public.chat_channels;
create trigger chat_channels_guard before insert or update on public.chat_channels
  for each row execute function public.chat_channels_guard();

-- Only private channels and direct messages have members, and only people in the shop.
create or replace function public.chat_members_guard()
returns trigger
language plpgsql
as $$
declare
  v_channel record;
begin
  select * into v_channel from public.chat_channel_meta(new.channel_id);
  new.org_id := v_channel.org_id;
  if not public.shop_has_member(new.org_id, new.user_id) then
    raise exception 'not_in_shop' using hint = 'Invite them to the shop first.';
  end if;
  if public.is_client_request() then
    if v_channel.kind <> 'channel' then
      raise exception 'channel_only';
    end if;
    new.added_by := auth.uid();
    new.added_at := now();
  end if;
  return new;
end;
$$;
drop trigger if exists chat_members_guard on public.chat_members;
create trigger chat_members_guard before insert on public.chat_members
  for each row execute function public.chat_members_guard();

-- Messages: always the signed-in person, in an open channel. Edits are the author's own.
-- Anyone else (an admin removing a message) can only delete it.
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
    if new.attachment_path is not null
       and new.attachment_path not like new.org_id::text || '/' || new.channel_id::text || '/%' then
      raise exception 'bad_attachment';
    end if;
    return new;
  end if;

  if public.is_client_request() then
    if new.channel_id <> old.channel_id or new.org_id <> old.org_id or new.author_id is distinct from old.author_id
       or new.created_at <> old.created_at or new.attachment_path is distinct from old.attachment_path then
      raise exception 'message_locked';
    end if;
    if old.deleted_at is not null then
      raise exception 'message_deleted';
    end if;
    if new.deleted_at is not null then
      -- Deleting clears the words. The row stays so the conversation still reads in order.
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
drop trigger if exists chat_messages_guard on public.chat_messages;
create trigger chat_messages_guard before insert or update on public.chat_messages
  for each row execute function public.chat_messages_guard();

-- Keeps the channel list sorted by the latest message.
create or replace function public.chat_messages_touch()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.chat_channels set last_message_at = new.created_at where id = new.channel_id;
  return new;
end;
$$;
drop trigger if exists chat_messages_touch on public.chat_messages;
create trigger chat_messages_touch after insert on public.chat_messages
  for each row execute function public.chat_messages_touch();

-- ---------- Row level security ----------

alter table public.chat_channels enable row level security;
alter table public.chat_members enable row level security;
alter table public.chat_messages enable row level security;
alter table public.chat_reads enable row level security;

do $$ begin
  create policy chat_channels_read on public.chat_channels for select to authenticated
    using (public.chat_can_read(id));
exception when duplicate_object then null; end $$;
do $$ begin
  create policy chat_channels_update on public.chat_channels for update to authenticated
    using (kind = 'channel' and public.shop_can(org_id, 'admin'))
    with check (kind = 'channel' and public.shop_can(org_id, 'admin'));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy chat_members_read on public.chat_members for select to authenticated
    using (public.chat_can_read(channel_id));
exception when duplicate_object then null; end $$;
-- Owners and admins add people to a channel. Anyone can leave one.
do $$ begin
  create policy chat_members_add on public.chat_members for insert to authenticated
    with check (public.shop_can(org_id, 'admin'));
exception when duplicate_object then null; end $$;
do $$ begin
  create policy chat_members_remove on public.chat_members for delete to authenticated
    using (user_id = auth.uid() or public.shop_can(org_id, 'admin'));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy chat_messages_read on public.chat_messages for select to authenticated
    using (public.chat_can_read(channel_id));
exception when duplicate_object then null; end $$;
do $$ begin
  create policy chat_messages_send on public.chat_messages for insert to authenticated
    with check (public.chat_can_read(channel_id));
exception when duplicate_object then null; end $$;
-- Authors edit or delete their own. Owners and admins can delete anyone's (the guard allows only that).
do $$ begin
  create policy chat_messages_change on public.chat_messages for update to authenticated
    using (public.chat_can_read(channel_id) and (author_id = auth.uid() or public.shop_can(org_id, 'admin')))
    with check (public.chat_can_read(channel_id));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy chat_reads_own on public.chat_reads for all to authenticated
    using (user_id = auth.uid()) with check (user_id = auth.uid() and public.chat_can_read(channel_id));
exception when duplicate_object then null; end $$;

revoke all on public.chat_channels, public.chat_members, public.chat_messages, public.chat_reads from anon;
grant select, update on public.chat_channels to authenticated;
grant select, insert, delete on public.chat_members to authenticated;
grant select, insert, update on public.chat_messages to authenticated;
grant select, insert, update on public.chat_reads to authenticated;

-- New messages reach open screens. Realtime checks the policies above for each person.
do $$ begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.chat_messages;
  end if;
exception when duplicate_object then null; end $$;

-- ---------- 5. Functions ----------

-- The channels the caller can read in one shop, with unread counts. Direct messages carry
-- the other person's id, and lead chats the lead's title.
drop function if exists public.my_chat_channels(uuid);
create function public.my_chat_channels(org uuid)
returns table (
  id uuid, kind text, name text, topic text, is_private boolean, lead_id uuid, lead_title text,
  other_user_id uuid, archived_at timestamptz, last_message_at timestamptz, unread integer
)
language sql
stable
security definer
set search_path = public
as $$
  select c.id, c.kind, c.name, c.topic, c.is_private, c.lead_id, l.title,
    case when c.kind = 'dm' then
      (select m.user_id from public.chat_members m where m.channel_id = c.id and m.user_id <> auth.uid() limit 1)
    end,
    c.archived_at, c.last_message_at,
    (select count(*)::int from public.chat_messages x
      where x.channel_id = c.id and x.deleted_at is null and x.author_id is distinct from auth.uid()
        and x.created_at > coalesce(r.last_read_at, '-infinity'))
  from public.chat_channels c
  left join public.leads l on l.id = c.lead_id
  left join public.chat_reads r on r.channel_id = c.id and r.user_id = auth.uid()
  where c.org_id = org and public.chat_can_read(c.id)
  order by c.kind, coalesce(c.last_message_at, c.created_at) desc;
$$;

-- Names and avatars of everyone in the shop, so chat can show who wrote what. Guests get
-- this too. Emails stay in shop_member_list(), which guests can't call.
drop function if exists public.chat_people(uuid);
create function public.chat_people(org uuid)
returns table (user_id uuid, role text, name text, avatar_url text)
language sql
stable
security definer
set search_path = public
as $$
  select m.user_id, m.role,
    coalesce(u.raw_user_meta_data ->> 'full_name',
      nullif(trim(concat_ws(' ', u.raw_user_meta_data ->> 'first_name', u.raw_user_meta_data ->> 'last_name')), ''),
      split_part(u.email::text, '@', 1)),
    coalesce(u.raw_user_meta_data ->> 'img_url', u.raw_user_meta_data ->> 'avatar_url')
  from public.shop_members m
  join auth.users u on u.id = m.user_id
  where m.org_id = org and public.shop_role(org) is not null
  order by public.shop_role_rank(m.role) desc, m.created_at;
$$;

-- The direct message between the caller and one teammate. Made the first time.
drop function if exists public.open_dm(uuid, uuid);
create function public.open_dm(org uuid, p_user uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
  v_key text;
  v_id uuid;
begin
  if public.shop_role(org) is null then
    raise exception 'not_allowed';
  end if;
  if p_user = v_me then
    raise exception 'dm_self';
  end if;
  if not exists (select 1 from public.shop_members where org_id = org and user_id = p_user) then
    raise exception 'not_in_shop';
  end if;
  v_key := least(v_me::text, p_user::text) || ':' || greatest(v_me::text, p_user::text);
  select id into v_id from public.chat_channels where org_id = org and kind = 'dm' and dm_key = v_key;
  if v_id is null then
    insert into public.chat_channels (org_id, kind, dm_key, created_by)
    values (org, 'dm', v_key, v_me)
    on conflict do nothing
    returning id into v_id;
    if v_id is null then
      select id into v_id from public.chat_channels where org_id = org and kind = 'dm' and dm_key = v_key;
    end if;
    insert into public.chat_members (channel_id, user_id, org_id, added_by)
    values (v_id, v_me, org, v_me), (v_id, p_user, org, v_me)
    on conflict do nothing;
  end if;
  return v_id;
end;
$$;

-- The chat on one lead, for anyone who can see the lead. Made the first time.
drop function if exists public.lead_chat(uuid);
create function public.lead_chat(p_lead uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
  v_id uuid;
begin
  if not public.lead_visible(p_lead) then
    raise exception 'not_allowed';
  end if;
  select id into v_id from public.chat_channels where kind = 'lead' and lead_id = p_lead;
  if v_id is null then
    select org_id into v_org from public.leads where id = p_lead;
    insert into public.chat_channels (org_id, kind, lead_id, created_by)
    values (v_org, 'lead', p_lead, auth.uid())
    on conflict do nothing
    returning id into v_id;
    if v_id is null then
      select id into v_id from public.chat_channels where kind = 'lead' and lead_id = p_lead;
    end if;
  end if;
  return v_id;
end;
$$;

-- A new channel. Owners and admins only. Private channels start with their maker and p_members.
drop function if exists public.create_chat_channel(uuid, text, text, boolean, uuid[]);
create function public.create_chat_channel(org uuid, p_name text, p_topic text, p_private boolean, p_members uuid[])
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text := lower(regexp_replace(trim(p_name), '[^a-zA-Z0-9-]+', '-', 'g'));
  v_id uuid;
begin
  if not public.shop_can(org, 'admin') then
    raise exception 'not_allowed';
  end if;
  v_name := trim(both '-' from v_name);
  if v_name = '' or length(v_name) > 40 then
    raise exception 'bad_name' using hint = 'Use 1 to 40 letters, numbers, or dashes.';
  end if;
  if exists (select 1 from public.chat_channels where org_id = org and kind = 'channel' and name = v_name) then
    raise exception 'name_taken';
  end if;
  insert into public.chat_channels (org_id, kind, name, topic, is_private, created_by)
  values (org, 'channel', v_name, nullif(trim(p_topic), ''), coalesce(p_private, false), auth.uid())
  returning id into v_id;
  if coalesce(p_private, false) then
    insert into public.chat_members (channel_id, user_id, org_id, added_by)
    select v_id, m.user_id, org, auth.uid()
    from public.shop_members m
    where m.org_id = org and (m.user_id = auth.uid() or m.user_id = any (coalesce(p_members, '{}')))
    on conflict do nothing;
  end if;
  return v_id;
end;
$$;

-- Marks a channel read up to now.
drop function if exists public.mark_chat_read(uuid);
create function public.mark_chat_read(p_channel uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.chat_can_read(p_channel) then
    raise exception 'not_allowed';
  end if;
  insert into public.chat_reads (channel_id, user_id, last_read_at)
  values (p_channel, auth.uid(), now())
  on conflict (channel_id, user_id) do update set last_read_at = excluded.last_read_at;
end;
$$;

revoke all on function
  public.my_chat_channels(uuid),
  public.chat_people(uuid),
  public.open_dm(uuid, uuid),
  public.lead_chat(uuid),
  public.create_chat_channel(uuid, text, text, boolean, uuid[]),
  public.mark_chat_read(uuid)
from public, anon;
grant execute on function
  public.my_chat_channels(uuid),
  public.chat_people(uuid),
  public.open_dm(uuid, uuid),
  public.lead_chat(uuid),
  public.create_chat_channel(uuid, text, text, boolean, uuid[]),
  public.mark_chat_read(uuid)
to authenticated;

-- ---------- 6. Storage: photos in messages ----------
-- Paths are <org id>/<channel id>/<file>. Anyone who can read the channel can read them.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('shop-chat', 'shop-chat', false, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

do $$ begin
  create policy shop_chat_insert on storage.objects for insert to authenticated
    with check (bucket_id = 'shop-chat'
      and public.chat_can_read(public.chat_path_channel(name))
      and public.shop_path_org(name) = public.chat_channel_org(public.chat_path_channel(name)));
exception when duplicate_object then null; end $$;
do $$ begin
  create policy shop_chat_read on storage.objects for select to authenticated
    using (bucket_id = 'shop-chat' and public.chat_can_read(public.chat_path_channel(name)));
exception when duplicate_object then null; end $$;

notify pgrst, 'reload schema';
