import { NextRequest } from 'next/server';
import { getAuthUser, Res } from '@/lib/auth';
import { query } from '@/lib/db';
import { CARS_REGISTRY, CAR_MODELS, type CarModel } from '@/models/car.model';

/**
 * GET /api/admin/stats?from=YYYY-MM-DD&to=YYYY-MM-DD
 *
 * Returns aggregated car statistics (confirmed bookings only):
 *   - total_bookings, total_hours per car
 *   - monthly breakdown per car
 *   - top instructors by hours
 *
 * Response 200:
 * {
 *   stats: CarStat[],
 *   monthly: MonthlyRow[],
 *   topInstructors: InstructorStat[]
 * }
 */
export async function GET(req: NextRequest) {
    const user = await getAuthUser(req);
    if (!user) return Res.unauthorized();

    const { searchParams } = new URL(req.url);
    const fromDate = searchParams.get('from') ?? undefined;
    const toDate   = searchParams.get('to')   ?? undefined;

    try {
        const params: unknown[] = [];
        const filters: string[] = ["status = 'confirmed'"];
        if (fromDate) { params.push(fromDate); filters.push(`booking_date >= $${params.length}`); }
        if (toDate)   { params.push(toDate);   filters.push(`booking_date <= $${params.length}`); }
        const where = 'WHERE ' + filters.join(' AND ');

        // Per-car totals
        const carRows = await query<{
            car_model: CarModel;
            total_bookings: string;
            total_minutes: string;
        }>(
            `SELECT car_model,
              COUNT(*) AS total_bookings,
              SUM(EXTRACT(EPOCH FROM (end_time::time - start_time::time)) / 60) AS total_minutes
       FROM bookings
       ${where}
       GROUP BY car_model`,
            params
        );

        const stats = CAR_MODELS.map((model) => {
            const car = CARS_REGISTRY[model];
            const row = carRows.find((r) => r.car_model === model);
            return {
                car_model:      model,
                car_name:       car.name,
                car_color:      car.color,
                car_emoji:      car.image_emoji,
                total_bookings: row ? parseInt(row.total_bookings) : 0,
                total_hours:    row ? Math.round(parseFloat(row.total_minutes) / 60 * 100) / 100 : 0,
            };
        });

        // Monthly breakdown per car
        const monthlyRows = await query<{
            car_model: CarModel;
            month: string;
            bookings: string;
            minutes: string;
        }>(
            `SELECT car_model,
              TO_CHAR(booking_date, 'YYYY-MM') AS month,
              COUNT(*) AS bookings,
              SUM(EXTRACT(EPOCH FROM (end_time::time - start_time::time)) / 60) AS minutes
       FROM bookings
       ${where}
       GROUP BY car_model, month
       ORDER BY month DESC, car_model`,
            params
        );

        const monthly = monthlyRows.map((r) => ({
            car_model: r.car_model,
            month:     r.month,
            bookings:  parseInt(r.bookings),
            hours:     Math.round(parseFloat(r.minutes) / 60 * 100) / 100,
        }));

        // Top instructors by total hours
        const instructorRows = await query<{
            full_name: string;
            total_bookings: string;
            total_minutes: string;
        }>(
            `SELECT TRIM(last_name || ' ' || first_name) AS full_name,
              COUNT(*) AS total_bookings,
              SUM(EXTRACT(EPOCH FROM (end_time::time - start_time::time)) / 60) AS total_minutes
       FROM bookings
       ${where}
       GROUP BY full_name
       ORDER BY total_minutes DESC
       LIMIT 20`,
            params
        );

        const topInstructors = instructorRows.map((r) => ({
            full_name:      r.full_name,
            total_bookings: parseInt(r.total_bookings),
            total_hours:    Math.round(parseFloat(r.total_minutes) / 60 * 100) / 100,
        }));

        return Res.ok({ stats, monthly, topInstructors });
    } catch (err) {
        console.error('[GET /api/admin/stats]', err);
        return Res.serverError();
    }
}