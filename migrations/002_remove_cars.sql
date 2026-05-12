-- Only needed if you're migrating an existing DB that had the cars table.
-- Safe to run on a fresh DB — all statements are idempotent.
ALTER TABLE public.bookings
    DROP CONSTRAINT IF EXISTS bookings_car_id_fkey,
    DROP COLUMN    IF EXISTS car_id;

DROP TABLE IF EXISTS public.cars;

DROP INDEX IF EXISTS idx_bookings_car_date;

CREATE INDEX IF NOT EXISTS idx_bookings_car_model_date
    ON public.bookings (car_model, booking_date);