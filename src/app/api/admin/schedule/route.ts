import { NextRequest } from 'next/server';
import { getAuthUser, Res } from '@/lib/auth';
import { query } from '@/lib/db';
import { CARS_REGISTRY, CAR_MODELS, type CarModel } from '@/models/car.model';

interface BookingRow {
    id: string;
    car_model: CarModel;
    car_name: string;
    booking_date: string;
    start_time: string;
    end_time: string;
    first_name: string;
    last_name: string;
    phone: string | null;
    status: 'confirmed' | 'cancelled';
}

/**
 * GET /api/admin/schedule?date=YYYY-MM-DD
 *
 * Returns all bookings for a given date grouped by car (all 4 cars included,
 * even if they have no bookings that day).
 *
 * Response 200:
 * {
 *   date: string,
 *   cars: [
 *     {
 *       car_model, car_name, car_color, car_emoji,
 *       bookings: [{ id, start_time, end_time, first_name, last_name, phone, status }]
 *     }
 *   ]
 * }
 */
export async function GET(req: NextRequest) {
    const user = await getAuthUser(req);
    if (!user) return Res.unauthorized();

    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return Res.badRequest('date query param required as YYYY-MM-DD');
    }

    try {
        const rows = await query<BookingRow>(
            `SELECT id, car_model, car_name, booking_date,
              start_time, end_time, first_name, last_name, phone, status
       FROM bookings
       WHERE booking_date = $1
       ORDER BY car_model, start_time`,
            [date]
        );

        // Pre-populate all cars (including ones with 0 bookings)
        const carMap: Record<string, {
            car_model: CarModel;
            car_name: string;
            car_color: string;
            car_emoji: string;
            bookings: BookingRow[];
        }> = {};

        for (const model of CAR_MODELS) {
            const car = CARS_REGISTRY[model];
            carMap[model] = {
                car_model: model,
                car_name: car.name,
                car_color: car.color,
                car_emoji: car.image_emoji,
                bookings: [],
            };
        }

        for (const row of rows) {
            carMap[row.car_model]?.bookings.push(row);
        }

        return Res.ok({ date, cars: Object.values(carMap) });
    } catch (err) {
        console.error('[GET /api/admin/schedule]', err);
        return Res.serverError();
    }
}