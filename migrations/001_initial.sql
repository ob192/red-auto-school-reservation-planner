-- Full initial schema (run on a fresh DB)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.profiles (
                                               id         uuid primary key references auth.users(id) on delete cascade,
                                               full_name  text,
                                               phone      text,
                                               created_at timestamptz default now()
);

CREATE TABLE IF NOT EXISTS public.bookings (
                                               id           uuid primary key default uuid_generate_v4(),
                                               user_id      uuid references auth.users(id) on delete cascade not null,
                                               car_model    text not null,
                                               car_name     text not null,
                                               booking_date date not null,
                                               start_time   time not null,
                                               end_time     time not null,
                                               first_name   text not null,
                                               last_name    text not null,
                                               phone        text,
                                               status       text default 'confirmed' check (status in ('confirmed', 'cancelled')),
                                               created_at   timestamptz default now(),
                                               constraint bookings_time_order check (end_time > start_time),
                                               constraint bookings_car_model_check
                                                   check (car_model in ('MAZDA', 'KIA RIO', 'TOYOTA', 'MINI COOPER'))
);

CREATE INDEX IF NOT EXISTS idx_bookings_car_model_date ON public.bookings (car_model, booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_user            ON public.bookings (user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_instructor      ON public.bookings (last_name, first_name);

-- Migrations tracking table (must be last in 001)
CREATE TABLE IF NOT EXISTS public._migrations (
                                                  id         serial primary key,
                                                  name       text unique not null,
                                                  applied_at timestamptz default now()
);