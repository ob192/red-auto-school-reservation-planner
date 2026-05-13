import { query } from '@/lib/db';
import { CARS_REGISTRY, type CarModel } from '@/models/car.model';

// ─── Types ────────────────────────────────────────────────────────

export interface InstructorBooking {
  id: string;
  car_model: CarModel;
  car_name: string;
  car_color: string;
  car_emoji: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  duration_hours: number;
  status: 'confirmed' | 'cancelled';
}

export interface MonthSummary {
  month: string;
  bookings: InstructorBooking[];
  total_hours: number;        // confirmed only
  cancelled_hours: number;
}

export interface CarSummary {
  car_model: CarModel;
  car_name: string;
  months: MonthSummary[];
  total_hours: number;        // confirmed only
  cancelled_hours: number;
}

export interface InstructorSchedule {
  instructor: string;
  cars: CarSummary[];
  grand_total_hours: number;      // confirmed only
  grand_cancelled_hours: number;
}

// ─── Raw DB row ───────────────────────────────────────────────────

interface RawRow {
  id: string;
  car_model: CarModel;
  car_name: string;
  booking_date: string | Date;
  start_time: string;
  end_time: string;
  first_name: string;
  last_name: string;
  status: 'confirmed' | 'cancelled';
}

// ─── Helpers ──────────────────────────────────────────────────────

function durationHours(start: string, end: string): number {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  return (eh * 60 + em - (sh * 60 + sm)) / 60;
}

function monthKey(dateStr: string | Date): string {
  const s = dateStr instanceof Date
      ? dateStr.toISOString().slice(0, 10)   // "2024-11-04T..." → "2024-11-04"
      : dateStr;
  return s.slice(0, 7);
}

// ─── Model functions ──────────────────────────────────────────────

export async function listInstructors(): Promise<string[]> {
  const rows = await query<{ full_name: string }>(
      `SELECT DISTINCT TRIM(last_name || ' ' || first_name) AS full_name
       FROM bookings
       ORDER BY full_name`
  );
  return rows.map((r) => r.full_name);
}

export async function getInstructorSchedule(
    instructorName: string,
    fromDate?: string,
    toDate?: string
): Promise<InstructorSchedule | null> {
  const spaceIdx = instructorName.indexOf(' ');
  if (spaceIdx === -1) return null;

  const lastName  = instructorName.slice(0, spaceIdx).trim();
  const firstName = instructorName.slice(spaceIdx + 1).trim();

  const params: unknown[] = [lastName, firstName];
  const dateFilters: string[] = [];
  if (fromDate) { params.push(fromDate); dateFilters.push(`booking_date >= $${params.length}`); }
  if (toDate)   { params.push(toDate);   dateFilters.push(`booking_date <= $${params.length}`); }
  const whereExtra = dateFilters.length ? ' AND ' + dateFilters.join(' AND ') : '';

  // Use ILIKE instead of LOWER() = LOWER() — ILIKE is locale-independent
  // and handles Cyrillic correctly on all Postgres installations.
  const rows = await query<RawRow>(
      `SELECT id, car_model, car_name, booking_date, start_time, end_time,
            first_name, last_name, status
     FROM bookings
     WHERE last_name  ILIKE $1
       AND first_name ILIKE $2
       ${whereExtra}
     ORDER BY car_model, booking_date, start_time`,
      params
  );

  if (rows.length === 0) return null;

  const carMap = new Map<CarModel, Map<string, InstructorBooking[]>>();

  for (const row of rows) {
    const car = CARS_REGISTRY[row.car_model];
    const rawDate = row.booking_date as unknown;
    const bookingDate = rawDate instanceof Date
        ? (rawDate as Date).toISOString().slice(0, 10)
        : (rawDate as string).slice(0, 10);

    const month = monthKey(bookingDate);
    const hours = durationHours(row.start_time, row.end_time);

    if (!carMap.has(row.car_model)) carMap.set(row.car_model, new Map());
    const monthMap = carMap.get(row.car_model)!;
    if (!monthMap.has(month)) monthMap.set(month, []);
    monthMap.get(month)!.push({
      id:             row.id,
      car_model:      row.car_model,
      car_name:       row.car_name,
      car_color:      car.color,
      car_emoji:      car.image_emoji,
      booking_date:   bookingDate,
      start_time:     row.start_time,
      end_time:       row.end_time,
      duration_hours: Math.round(hours * 100) / 100,
      status:         row.status,
    });
  }

  let grandTotal = 0;
  let grandCancelled = 0;
  const cars: CarSummary[] = [];

  for (const [carModel, monthMap] of carMap.entries()) {
    const car = CARS_REGISTRY[carModel];
    let carConfirmed = 0;
    let carCancelled = 0;
    const months: MonthSummary[] = [];

    for (const [month, bookings] of [...monthMap.entries()].sort()) {
      const monthConfirmed = bookings
          .filter(b => b.status === 'confirmed')
          .reduce((s, b) => s + b.duration_hours, 0);
      const monthCancelled = bookings
          .filter(b => b.status === 'cancelled')
          .reduce((s, b) => s + b.duration_hours, 0);

      carConfirmed += monthConfirmed;
      carCancelled += monthCancelled;
      months.push({
        month,
        bookings,
        total_hours:     Math.round(monthConfirmed * 100) / 100,
        cancelled_hours: Math.round(monthCancelled * 100) / 100,
      });
    }

    grandTotal    += carConfirmed;
    grandCancelled += carCancelled;
    cars.push({
      car_model:       carModel,
      car_name:        car.name,
      months,
      total_hours:     Math.round(carConfirmed * 100) / 100,
      cancelled_hours: Math.round(carCancelled * 100) / 100,
    });
  }

  return {
    instructor:             `${lastName} ${firstName}`,
    cars,
    grand_total_hours:      Math.round(grandTotal    * 100) / 100,
    grand_cancelled_hours:  Math.round(grandCancelled * 100) / 100,
  };
}

export async function getAllInstructorBookings(fromDate?: string, toDate?: string) {
  const params: unknown[] = [];
  const dateFilters: string[] = [];
  if (fromDate) { params.push(fromDate); dateFilters.push(`booking_date >= $${params.length}`); }
  if (toDate)   { params.push(toDate);   dateFilters.push(`booking_date <= $${params.length}`); }
  const whereClause = dateFilters.length ? 'WHERE ' + dateFilters.join(' AND ') : '';

  const rows = await query<RawRow>(
      `SELECT id, car_model, car_name, booking_date, start_time, end_time,
              first_name, last_name, status
       FROM bookings
              ${whereClause}
       ORDER BY last_name, first_name, car_model, booking_date, start_time`,
      params
  );

  return rows.map((row) => {
    const car = CARS_REGISTRY[row.car_model];
    return {
      instructor:     `${row.last_name} ${row.first_name}`,
      car_model:      row.car_model,
      car_name:       row.car_name,
      car_color:      car.color,
      booking_date:   row.booking_date,
      start_time:     row.start_time,
      end_time:       row.end_time,
      duration_hours: Math.round(durationHours(row.start_time, row.end_time) * 100) / 100,
      status:         row.status,
    };
  });
}