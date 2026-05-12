import { query, queryOne } from '@/lib/db';
import { z } from 'zod';
import { CAR_MODELS, CARS_REGISTRY, type CarModel } from '@/models/car.model';

// ─── Types ────────────────────────────────────────────────────────

export interface Booking {
  id: string;
  user_id: string;
  car_model: CarModel;
  car_name: string;
  booking_date: string;   // YYYY-MM-DD
  start_time: string;     // HH:MM:SS
  end_time: string;       // HH:MM:SS
  first_name: string;
  last_name: string;
  phone: string | null;
  status: 'confirmed' | 'cancelled';
  created_at: string;
}

export interface BookingWithCar extends Booking {
  car_color: string;
  car_emoji: string;
}

// ─── Validation ───────────────────────────────────────────────────

export const createBookingSchema = z.object({
  car_model: z.enum(CAR_MODELS, { message: 'Invalid car_model' }),
  booking_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'booking_date must be YYYY-MM-DD'),
  start_time: z.string().regex(/^\d{2}:\d{2}$/, 'start_time must be HH:MM'),
  end_time: z.string().regex(/^\d{2}:\d{2}$/, 'end_time must be HH:MM'),
  first_name: z.string().min(1).max(50),
  last_name: z.string().min(1).max(50),
  phone: z.string().min(6).max(30).optional(),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;

// ─── Helpers ──────────────────────────────────────────────────────

function fmt(t: string): string {
  return t.length === 5 ? `${t}:00` : t;
}

function enrichBooking(b: Booking): BookingWithCar {
  const car = CARS_REGISTRY[b.car_model];
  return {
    ...b,
    car_color: car.color,
    car_emoji: car.image_emoji,
  };
}

// ─── Model functions ──────────────────────────────────────────────

export async function getBookingsOnDate(
    carModel: CarModel,
    date: string
): Promise<Booking[]> {
  return query<Booking>(
      `SELECT * FROM bookings
       WHERE car_model = $1
         AND booking_date = $2
         AND status = 'confirmed'
       ORDER BY start_time`,
      [carModel, date]
  );
}

export async function getOverlappingBookings(
    carModel: CarModel,
    date: string,
    startTime: string,
    endTime: string
): Promise<Booking[]> {
  return query<Booking>(
      `SELECT * FROM bookings
       WHERE car_model = $1
         AND booking_date = $2
         AND status = 'confirmed'
         AND start_time < $4::time
         AND end_time   > $3::time`,
      [carModel, date, fmt(startTime), fmt(endTime)]
  );
}

export async function createBooking(
    userId: string,
    input: CreateBookingInput
): Promise<BookingWithCar> {
  const car = CARS_REGISTRY[input.car_model]; // no DB round-trip

  const rows = await query<Booking>(
      `INSERT INTO bookings
       (user_id, car_model, car_name, booking_date, start_time, end_time,
        first_name, last_name, phone, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'confirmed')
     RETURNING *`,
      [
        userId,
        input.car_model,
        car.name,
        input.booking_date,
        fmt(input.start_time),
        fmt(input.end_time),
        input.first_name,
        input.last_name,
        input.phone ?? null,
      ]
  );
  return enrichBooking(rows[0]);
}

export async function getMyBookings(userId: string): Promise<BookingWithCar[]> {
  const rows = await query<Booking>(
      `SELECT * FROM bookings
     WHERE user_id = $1
       AND booking_date >= CURRENT_DATE
     ORDER BY booking_date, start_time`,
      [userId]
  );
  return rows.map(enrichBooking);
}

export async function getBookingById(
    id: string,
    userId?: string
): Promise<BookingWithCar | null> {
  const row = userId
      ? await queryOne<Booking>('SELECT * FROM bookings WHERE id = $1 AND user_id = $2', [id, userId])
      : await queryOne<Booking>('SELECT * FROM bookings WHERE id = $1', [id]);
  return row ? enrichBooking(row) : null;
}

export async function cancelBooking(
    id: string,
    userId: string
): Promise<BookingWithCar | null> {
  const rows = await query<Booking>(
      `UPDATE bookings
       SET status = 'cancelled'
       WHERE id = $1 AND user_id = $2 AND status = 'confirmed'
       RETURNING *`,
      [id, userId]
  );
  return rows[0] ? enrichBooking(rows[0]) : null;
}