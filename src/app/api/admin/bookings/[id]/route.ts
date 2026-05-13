import { NextRequest } from 'next/server';
import { getAuthUser, Res } from '@/lib/auth';
import { query } from '@/lib/db';
import { CARS_REGISTRY, type CarModel } from '@/models/car.model';

type Params = { params: Promise<{ id: string }> };

/**
 * GET /api/admin/bookings/:id
 *
 * Returns a single booking by ID (admin — no user_id restriction).
 */
export async function GET(req: NextRequest, { params }: Params) {
    const user = await getAuthUser(req);
    if (!user) return Res.unauthorized();

    const { id } = await params;

    try {
        const rows = await query(
            `SELECT * FROM bookings WHERE id = $1`,
            [id]
        );
        if (!rows[0]) return Res.notFound();

        const b = rows[0] as { car_model: CarModel } & Record<string, unknown>;
        const car = CARS_REGISTRY[b.car_model];
        return Res.ok({
            booking: { ...b, car_color: car?.color ?? '', car_emoji: car?.image_emoji ?? '🚗' },
        });
    } catch (err) {
        console.error(`[GET /api/admin/bookings/${id}]`, err);
        return Res.serverError();
    }
}

/**
 * PATCH /api/admin/bookings/:id
 *
 * Updates a booking's status (admin can cancel OR re-confirm any booking).
 *
 * Body: { status: 'confirmed' | 'cancelled' }
 *
 * Response 200: { booking }
 * Response 404: not found
 */
export async function PATCH(req: NextRequest, { params }: Params) {
    const user = await getAuthUser(req);
    if (!user) return Res.unauthorized();

    const { id } = await params;

    let body: unknown;
    try { body = await req.json(); }
    catch { return Res.badRequest('INVALID_JSON'); }

    const { status } = body as Record<string, unknown>;

    if (status !== 'confirmed' && status !== 'cancelled') {
        return Res.badRequest('status must be "confirmed" or "cancelled"');
    }

    try {
        const rows = await query(
            `UPDATE bookings
             SET status = $1, updated_at = NOW()
             WHERE id = $2
             RETURNING *`,
            [status, id]
        );

        if (!rows[0]) return Res.notFound('BOOKING_NOT_FOUND');

        const b = rows[0] as { car_model: CarModel } & Record<string, unknown>;
        const car = CARS_REGISTRY[b.car_model];
        return Res.ok({
            booking: { ...b, car_color: car?.color ?? '', car_emoji: car?.image_emoji ?? '🚗' },
        });
    } catch (err) {
        console.error(`[PATCH /api/admin/bookings/${id}]`, err);
        return Res.serverError();
    }
}

/**
 * DELETE /api/admin/bookings/:id
 *
 * Hard-deletes a booking record (use with care — prefer PATCH to cancel).
 *
 * Response 200: { deleted: id }
 * Response 404: not found
 */
export async function DELETE(req: NextRequest, { params }: Params) {
    const user = await getAuthUser(req);
    if (!user) return Res.unauthorized();

    const { id } = await params;

    try {
        const rows = await query(
            `DELETE FROM bookings WHERE id = $1 RETURNING id`,
            [id]
        );
        if (!rows[0]) return Res.notFound('BOOKING_NOT_FOUND');
        return Res.ok({ deleted: id });
    } catch (err) {
        console.error(`[DELETE /api/admin/bookings/${id}]`, err);
        return Res.serverError();
    }
}