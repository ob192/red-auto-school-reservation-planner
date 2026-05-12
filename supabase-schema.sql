-- ═══════════════════════════════════════════════════════════════
-- Red Auto School — Supabase / Postgres Schema
-- Run this in your Supabase SQL editor (or any psql client)
-- ═══════════════════════════════════════════════════════════════

create extension if not exists "uuid-ossp";

-- ── PROFILES (synced from auth.users) ────────────────────────────
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  phone       text,
  created_at  timestamptz default now()
);

-- ── CARS ─────────────────────────────────────────────────────────
create table if not exists public.cars (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  model       text not null,
  color       text not null,
  image_emoji text not null default '🚗',
  is_active   boolean default true,
  created_at  timestamptz default now()
);

insert into public.cars (name, model, color, image_emoji) values
  ('Mazda 3',      'MAZDA',       'Червона',  '🚗'),
  ('Kia Rio',      'KIA RIO',     'Біла',     '🚙'),
  ('Toyota Camry', 'TOYOTA',      'Чорна',    '🏎️'),
  ('Mini Cooper',  'MINI COOPER', 'Синя',     '🚓')
on conflict do nothing;

-- ── BOOKINGS ─────────────────────────────────────────────────────
create table if not exists public.bookings (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid references auth.users(id) on delete cascade not null,
  car_id       uuid references public.cars(id) not null,
  car_name     text not null,
  booking_date date not null,
  start_time   time not null,
  end_time     time not null,
  first_name   text not null,
  last_name    text not null,
  phone        text,
  status       text default 'confirmed' check (status in ('confirmed', 'cancelled')),
  created_at   timestamptz default now(),

  -- Sanity check: end must be after start
  constraint bookings_time_order check (end_time > start_time)
);

-- Index to speed up overlap queries and the instructor view
create index if not exists idx_bookings_car_date   on public.bookings (car_id, booking_date);
create index if not exists idx_bookings_user        on public.bookings (user_id);
create index if not exists idx_bookings_instructor  on public.bookings (last_name, first_name);
create index if not exists idx_bookings_date        on public.bookings (booking_date);

-- ── ROW LEVEL SECURITY ────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.cars      enable row level security;
alter table public.bookings  enable row level security;

-- Profiles
create policy if not exists "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy if not exists "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);
create policy if not exists "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- Cars: any authenticated user can read
create policy if not exists "cars_select_auth" on public.cars
  for select to authenticated using (true);

-- Bookings: users can do anything with their own rows;
--           anyone authenticated can SELECT (needed for conflict detection).
create policy if not exists "bookings_select_auth" on public.bookings
  for select to authenticated using (true);
create policy if not exists "bookings_insert_own" on public.bookings
  for insert with check (auth.uid() = user_id);
create policy if not exists "bookings_update_own" on public.bookings
  for update using (auth.uid() = user_id);

-- ── TRIGGER: create profile on signup ────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
