import { NextRequest } from 'next/server';
import { getAuthUser, Res } from '@/lib/auth';
import { query } from '@/lib/db';
import { CAR_MODELS, CARS_REGISTRY, type CarModel } from '@/models/car.model';
import { createBookingSchema } from '@/models/booking.model';

/**
 * GET /api/admin/bookings
 *
 * Lists all bookings across all users with optional filters.
 *
 * Query params:
 *   from=YYYY-MM-DD    — booking_date >=
 *   to=YYYY-MM-DD      — booking_date <=
 *   car_model=MAZDA    — filter by car
 *   status=confirmed   — filter by status
 *   search=text        — fuzzy match on first_name / last_name
 *   page=1             — 1-based page number (default 1)
 *   limit=50           — page size (max 100, default 50)
 *
 * Response 200:
 * {
 *   bookings: AdminBookingRow[],
 *   total: number,
 *   page: number,
 *   limit: number
 * }
 */
export async function GET(req: NextRequest) {
    const user = await getAuthUser(req);
    if (!user) return Res.unauthorized();

    const { searchParams } = new URL(req.url);
    const from     = searchParams.get('from')      ?? undefined;
    const to       = searchParams.get('to')        ?? undefined;
    const carModel = searchParams.get('car_model') ?? undefined;
    const status   = searchParams.get('status')    ?? undefined;
    const search   = searchParams.get('search')    ?? undefined;
    const page     = Math.max(1, parseInt(searchParams.get('page')  ?? '1'));
    const limit    = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '50')));
    const offset   = (page - 1) * limit;

    try {
        const filterParams: unknown[] = [];
        const filters: string[] = [];

        if (from) {
            filterParams.push(from);
            filters.push(`booking_date >= $${filterParams.length}`);
        }
        if (to) {
            filterParams.push(to);
            filters.push(`booking_date <= $${filterParams.length}`);
        }
        if (carModel && (CAR_MODELS as readonly string[]).includes(carModel)) {
            filterParams.push(carModel);
            filters.push(`car_model = $${filterParams.length}`);
        }
        if (status === 'confirmed' || status === 'cancelled') {
            filterParams.push(status);
            filters.push(`status = $${filterParams.length}`);
        }
        if (search) {
            filterParams.push(`%${search.toLowerCase()}%`);
            filters.push(
                `(LOWER(first_name) LIKE $${filterParams.length} OR LOWER(last_name) LIKE $${filterParams.length})`
            );
        }

        const where = filters.length ? 'WHERE ' + filters.join(' AND ') : '';

        // Count total for pagination
        const [{ total }] = await query<{ total: string }>(
            `SELECT COUNT(*) AS total FROM bookings ${where}`,
            filterParams
        );

        // Paginated rows
        const paginatedParams = [...filterParams, limit, offset];
        const rows = await query<{
            id: string;
            user_id: string;
            car_model: CarModel;
            car_name: string;
            booking_date: string;
            start_time: string;
            end_time: string;
            first_name: string;
            last_name: string;
            phone: string | null;
            status: 'confirmed' | 'cancelled';
            created_at: string;
        }>(
            `SELECT id, user_id, car_model, car_name, booking_date,
                    start_time, end_time, first_name, last_name, phone, status, created_at
             FROM bookings
             ${where}
             ORDER BY booking_date DESC, start_time ASC
             LIMIT $${paginatedParams.length - 1} OFFSET $${paginatedParams.length}`,
            paginatedParams
        );

        // Enrich with car metadata
        const bookings = rows.map((r) => {
            const car = CARS_REGISTRY[r.car_model];
            return {
                ...r,
                car_color: car?.color  ?? '',
                car_emoji: car?.image_emoji ?? '🚗',
            };
        });

        return Res.ok({
            bookings,
            total: parseInt(total),
            page,
            limit,
        });
    } catch (err) {
        console.error('[GET /api/admin/bookings]', err);
        return Res.serverError();
    }
}

/**
 * POST /api/admin/bookings
 *
 * Creates a booking on behalf of any person (no user account required).
 * Shares the same validation + overlap check as the user-facing endpoint,
 * but does NOT require the caller to be the student.
 *
 * Body: same as POST /api/bookings (car_model, booking_date, start_time,
 *       end_time, first_name, last_name, phone?)
 *
 * Response 201: { booking: BookingWithCar }
 * Response 409: SLOT_TAKEN
 */
export async function POST(req: NextRequest) {
    const user = await getAuthUser(req);
    if (!user) return Res.unauthorized();

    let body: unknown;
    try { body = await req.json(); }
    catch { return Res.badRequest('INVALID_JSON'); }

    const parsed = createBookingSchema.safeParse(body);
    if (!parsed.success) {
        return Res.badRequest('VALIDATION_FAILED', parsed.error.flatten().fieldErrors);
    }

    const input = parsed.data;

    if (input.start_time >= input.end_time) {
        return Res.badRequest('start_time must be before end_time');
    }

    const fmt = (t: string) => (t.length === 5 ? `${t}:00` : t);

    try {
        // Overlap check
        const conflicts = await query(
            `SELECT id FROM bookings
             WHERE car_model    = $1
               AND booking_date = $2
               AND status       = 'confirmed'
               AND start_time   < $4::time
               AND end_time     > $3::time`,
            [input.car_model, input.booking_date, fmt(input.start_time), fmt(input.end_time)]
        );
        if (conflicts.length > 0) return Res.conflict('SLOT_TAKEN');

        const car = CARS_REGISTRY[input.car_model];
        const rows = await query(
            `INSERT INTO bookings
               (user_id, car_model, car_name, booking_date,
                start_time, end_time, first_name, last_name, phone, status)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'confirmed')
             RETURNING *`,
            [
                user.id,              // booked-by admin's own user_id
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

        const booking = { ...rows[0], car_color: car.color, car_emoji: car.image_emoji };
        return Res.created({ booking });
    } catch (err) {
        console.error('[POST /api/admin/bookings]', err);
        return Res.serverError();
    }
}