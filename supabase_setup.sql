-- ══════════════════════════════════════════════════════════════
--  LECTRACK – SUPABASE COMPLETE SETUP SCRIPT
--  Run this entire script in:
--  Supabase Dashboard → SQL Editor → New Query → Paste → Run
-- ══════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────
-- 1. PROFILES TABLE
--    One row per user (id = auth.users.id)
-- ─────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,

  -- Personal info
  full_name     text,
  email         text,
  phone         text,
  avatar_url    text,

  -- Academic info
  prn           text,
  roll_number   text,
  division      text,
  branch        text,   -- 'computer' | 'it' | 'entc' | 'mechanical' | 'civil' | 'electrical' | 'aids' | 'aiml'
  year          text,   -- 'fe' | 'se' | 'te' | 'be'
  college       text,
  academic_year text,   -- e.g. '2024-25'

  -- Timestamps
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- Auto-update updated_at on every row change
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();


-- ─────────────────────────────────────────────────────────────
-- 2. AUTO-CREATE PROFILE ROW ON SIGNUP
--    Triggered whenever a new user is created in auth.users
-- ─────────────────────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ─────────────────────────────────────────────────────────────
-- 3. ROW LEVEL SECURITY (RLS)
--    Users can only read/write their own profile row
-- ─────────────────────────────────────────────────────────────
alter table public.profiles enable row level security;

-- Drop old policies if re-running
drop policy if exists "Users can view own profile"   on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can delete own profile" on public.profiles;

create policy "Users can view own profile"
  on public.profiles for select
  using ( auth.uid() = id );

create policy "Users can insert own profile"
  on public.profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile"
  on public.profiles for update
  using ( auth.uid() = id );

create policy "Users can delete own profile"
  on public.profiles for delete
  using ( auth.uid() = id );


-- ─────────────────────────────────────────────────────────────
-- 4. AVATARS STORAGE BUCKET
--    Public bucket so avatar images load without auth headers
-- ─────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

-- Drop old storage policies if re-running
drop policy if exists "Avatar images are publicly readable" on storage.objects;
drop policy if exists "Users can upload their own avatar"   on storage.objects;
drop policy if exists "Users can update their own avatar"   on storage.objects;
drop policy if exists "Users can delete their own avatar"   on storage.objects;

-- Anyone can view avatars (public read)
create policy "Avatar images are publicly readable"
  on storage.objects for select
  using ( bucket_id = 'avatars' );

-- Logged-in users can upload to their own folder (avatars/<user-id>.ext)
create policy "Users can upload their own avatar"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = split_part(name, '/', 2)   -- e.g. avatars/UUID.jpg
  );

create policy "Users can update their own avatar"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = split_part(name, '/', 2)
  );

create policy "Users can delete their own avatar"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = split_part(name, '/', 2)
  );


-- ─────────────────────────────────────────────────────────────
-- 5. TIMETABLE TABLE  (optional – for persisting timetables)
--    Stores each user's timetable as a JSONB array
-- ─────────────────────────────────────────────────────────────
create table if not exists public.timetables (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  lectures   jsonb not null default '[]'::jsonb,  -- array of lecture objects
  updated_at timestamptz default now()
);

alter table public.timetables enable row level security;

drop policy if exists "Users can manage own timetable" on public.timetables;
create policy "Users can manage own timetable"
  on public.timetables for all
  using ( auth.uid() = user_id )
  with check ( auth.uid() = user_id );

drop trigger if exists timetables_updated_at on public.timetables;
create trigger timetables_updated_at
  before update on public.timetables
  for each row execute procedure public.handle_updated_at();


-- ─────────────────────────────────────────────────────────────
-- 6. CONFUSION_LOGS TABLE  (optional – for tracking history)
--    One row per "session" of confusion tracking
-- ─────────────────────────────────────────────────────────────
create table if not exists public.confusion_logs (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  subject         text not null,
  confused_topics text[] default '{}',
  total_topics    int  default 0,
  logged_at       timestamptz default now()
);

alter table public.confusion_logs enable row level security;

drop policy if exists "Users can manage own confusion logs" on public.confusion_logs;
create policy "Users can manage own confusion logs"
  on public.confusion_logs for all
  using ( auth.uid() = user_id )
  with check ( auth.uid() = user_id );


-- ─────────────────────────────────────────────────────────────
-- 7. VERIFICATION QUERY
--    Run this after the script to confirm everything was created
-- ─────────────────────────────────────────────────────────────
select
  table_name,
  (select count(*) from information_schema.columns c
   where c.table_name = t.table_name and c.table_schema = 'public') as column_count
from information_schema.tables t
where table_schema = 'public'
  and table_name in ('profiles', 'timetables', 'confusion_logs')
order by table_name;
