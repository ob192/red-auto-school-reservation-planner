import { NextRequest } from 'next/server';
import { getAuthUser, Res } from '@/lib/auth';
import { getBookingById, cancelBooking } from '@/models/booking.model';

type Params = { params: Promise<{ id: string }> };

/**
 * GET /api/bookings/:id
 *
 * Returns a single booking owned by the authenticated user.
 */
export async function GET(req: NextRequest, { params }: Params) {
  const user = await getAuthUser(req);
  if (!user) return Res.unauthorized();

  const { id } = await params;

  try {
    const booking = await getBookingById(id, user.id);
    if (!booking) return Res.notFound();
    return Res.ok({ booking });
  } catch (err) {
    console.error(`[GET /api/bookings/${id}]`, err);
    return Res.serverError();
  }
}

/**
 * DELETE /api/bookings/:id
 *
 * Soft-cancels a booking owned by the authenticated user.
 *
 * Response 200: { booking: Booking }   (with status = 'cancelled')
 * Response 404: booking not found or already cancelled
 */
export async function DELETE(req: NextRequest, { params }: Params) {
  const user = await getAuthUser(req);
  if (!user) return Res.unauthorized();

  const { id } = await params;

  try {
    const booking = await cancelBooking(id, user.id);
    if (!booking) return Res.notFound('BOOKING_NOT_FOUND_OR_ALREADY_CANCELLED');
    return Res.ok({ booking });
  } catch (err) {
    console.error(`[DELETE /api/bookings/${id}]`, err);
    return Res.serverError();
  }
}
