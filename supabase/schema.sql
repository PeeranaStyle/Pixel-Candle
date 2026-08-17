create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.candle_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  candle_type text not null check (candle_type in ('small', 'medium', 'large')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  status text not null default 'active' check (status in ('active', 'completed', 'abandoned')),
  created_at timestamptz not null default now()
);

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  message text not null check (char_length(message) between 2 and 600),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.candle_sessions enable row level security;
alter table public.feedback enable row level security;

create policy "Users can read their profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert their profile"
  on public.profiles for insert
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

create index if not exists candle_sessions_user_id_created_at_idx
  on public.candle_sessions (user_id, created_at desc);

create index if not exists feedback_user_id_created_at_idx
  on public.feedback (user_id, created_at desc);
