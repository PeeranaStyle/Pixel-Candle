create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'quiet flame' check (char_length(display_name) between 1 and 32),
  avatar_id text not null default 'ember',
  created_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists display_name text not null default 'quiet flame',
  add column if not exists avatar_id text not null default 'ember',
  add column if not exists updated_at timestamptz not null default now();

alter table public.profiles
  drop constraint if exists profiles_display_name_length;

alter table public.profiles
  add constraint profiles_display_name_length check (char_length(display_name) between 1 and 32);

create table if not exists public.candle_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  candle_type text not null check (candle_type in ('small', 'medium', 'large')),
  started_at timestamptz not null default now(),
  duration_ms integer not null default 300000 check (duration_ms > 0),
  completed_at timestamptz,
  status text not null default 'active' check (status in ('active', 'completed', 'abandoned')),
  created_at timestamptz not null default now()
);

alter table public.candle_sessions
  add column if not exists duration_ms integer not null default 300000;

alter table public.candle_sessions
  drop constraint if exists candle_sessions_duration_ms_positive;

alter table public.candle_sessions
  add constraint candle_sessions_duration_ms_positive check (duration_ms > 0);

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  message text not null check (char_length(message) between 2 and 600),
  created_at timestamptz not null default now()
);

create table if not exists public.study_rooms (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('shared', 'match')),
  status text not null default 'waiting' check (status in ('waiting', 'active', 'completed', 'closed')),
  max_members integer not null default 8 check (max_members between 2 and 24),
  chat_mode text not null default 'limited' check (chat_mode in ('limited', 'off')),
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  ended_at timestamptz
);

create table if not exists public.room_members (
  room_id uuid not null references public.study_rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid references public.candle_sessions(id) on delete set null,
  status text not null default 'joined' check (status in ('joined', 'ready', 'studying', 'completed', 'left')),
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  primary key (room_id, user_id)
);

create table if not exists public.room_messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.study_rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  message text not null check (char_length(message) between 1 and 280),
  created_at timestamptz not null default now()
);

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null unique references public.study_rooms(id) on delete cascade,
  user_a uuid not null references auth.users(id) on delete cascade,
  user_b uuid references auth.users(id) on delete set null,
  duration_ms integer not null check (duration_ms > 0),
  status text not null default 'searching' check (status in ('searching', 'matched', 'waiting_ready', 'countdown', 'studying', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  started_at timestamptz
);

alter table public.profiles enable row level security;
alter table public.candle_sessions enable row level security;
alter table public.feedback enable row level security;
alter table public.study_rooms enable row level security;
alter table public.room_members enable row level security;
alter table public.room_messages enable row level security;
alter table public.matches enable row level security;

drop policy if exists "Users can read their profile" on public.profiles;
drop policy if exists "Users can insert their profile" on public.profiles;
drop policy if exists "Users can update their profile" on public.profiles;
drop policy if exists "Users can read their candle sessions" on public.candle_sessions;
drop policy if exists "Users can insert their candle sessions" on public.candle_sessions;
drop policy if exists "Users can update their candle sessions" on public.candle_sessions;
drop policy if exists "Users can send feedback" on public.feedback;
drop policy if exists "Users can read their feedback" on public.feedback;
drop policy if exists "Users can create rooms" on public.study_rooms;
drop policy if exists "Users can read joined rooms" on public.study_rooms;
drop policy if exists "Room creators can close rooms" on public.study_rooms;
drop policy if exists "Users can join themselves" on public.room_members;
drop policy if exists "Users can read members in their rooms" on public.room_members;
drop policy if exists "Users can update their membership" on public.room_members;
drop policy if exists "Users can read room messages" on public.room_messages;
drop policy if exists "Users can read their matches" on public.matches;
drop policy if exists "Users can create match searches" on public.matches;

create policy "Users can read their profile"
  on public.profiles for select
  using (true);

create policy "Users can insert their profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Users can read their candle sessions"
  on public.candle_sessions for select
  using (auth.uid() = user_id);

create policy "Users can insert their candle sessions"
  on public.candle_sessions for insert
  with check (auth.uid() = user_id);

create policy "Users can update their candle sessions"
  on public.candle_sessions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can send feedback"
  on public.feedback for insert
  with check (auth.uid() = user_id);

create policy "Users can read their feedback"
  on public.feedback for select
  using (auth.uid() = user_id);

create policy "Users can create rooms"
  on public.study_rooms for insert
  with check (auth.uid() = created_by);

create policy "Users can read joined rooms"
  on public.study_rooms for select
  using (
    created_by = auth.uid()
    or (type = 'shared' and status in ('waiting', 'active'))
    or exists (
      select 1 from public.room_members
      where room_members.room_id = study_rooms.id
      and room_members.user_id = auth.uid()
      and room_members.left_at is null
    )
  );

create policy "Room creators can close rooms"
  on public.study_rooms for update
  using (created_by = auth.uid())
  with check (created_by = auth.uid());

create policy "Users can join themselves"
  on public.room_members for insert
  with check (auth.uid() = user_id);

create policy "Users can read members in their rooms"
  on public.room_members for select
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.room_members own_membership
      where own_membership.room_id = room_members.room_id
      and own_membership.user_id = auth.uid()
      and own_membership.left_at is null
    )
  );

create policy "Users can update their membership"
  on public.room_members for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can read room messages"
  on public.room_messages for select
  using (
    exists (
      select 1 from public.room_members
      where room_members.room_id = room_messages.room_id
      and room_members.user_id = auth.uid()
      and room_members.left_at is null
    )
  );

create policy "Users can read their matches"
  on public.matches for select
  using (auth.uid() = user_a or auth.uid() = user_b);

create policy "Users can create match searches"
  on public.matches for insert
  with check (auth.uid() = user_a and user_b is null and status = 'searching');

create index if not exists candle_sessions_user_id_created_at_idx
  on public.candle_sessions (user_id, created_at desc);

create index if not exists feedback_user_id_created_at_idx
  on public.feedback (user_id, created_at desc);

create index if not exists study_rooms_status_created_at_idx
  on public.study_rooms (status, created_at desc);

create index if not exists room_members_user_id_status_idx
  on public.room_members (user_id, status);

create index if not exists room_members_room_id_status_idx
  on public.room_members (room_id, status);

create index if not exists room_messages_room_id_created_at_idx
  on public.room_messages (room_id, created_at desc);

create index if not exists matches_status_created_at_idx
  on public.matches (status, created_at);

create or replace function public.touch_profile_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_profile_updated_at();

create or replace function public.send_room_message(p_room_id uuid, p_message text)
returns public.room_messages
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room public.study_rooms;
  v_message text;
  v_last_message_at timestamptz;
  v_inserted public.room_messages;
begin
  v_message := trim(p_message);

  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  if char_length(v_message) < 1 or char_length(v_message) > 280 then
    raise exception 'invalid message';
  end if;

  select * into v_room
  from public.study_rooms
  where id = p_room_id
  and status in ('waiting', 'active');

  if not found then
    raise exception 'room unavailable';
  end if;

  if v_room.chat_mode = 'off' then
    raise exception 'messages are off';
  end if;

  if not exists (
    select 1 from public.room_members
    where room_id = p_room_id
    and user_id = auth.uid()
    and left_at is null
  ) then
    raise exception 'not a room member';
  end if;

  select created_at into v_last_message_at
  from public.room_messages
  where room_id = p_room_id
  and user_id = auth.uid()
  order by created_at desc
  limit 1;

  if v_last_message_at is not null and now() - v_last_message_at < interval '60 seconds' then
    raise exception 'message cooldown';
  end if;

  insert into public.room_messages (room_id, user_id, message)
  values (p_room_id, auth.uid(), v_message)
  returning * into v_inserted;

  return v_inserted;
end;
$$;
