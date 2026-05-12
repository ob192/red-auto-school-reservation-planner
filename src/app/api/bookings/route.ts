import { NextRequest } from 'next/server';
import { getAuthUser, Res } from '@/lib/auth';
import {
  getMyBookings,
  createBooking,
  getOverlappingBookings,
  createBookingSchema,
} from '@/models/booking.model';

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return Res.unauthorized();

  try {
    const bookings = await getMyBookings(user.id);
    return Res.ok({ bookings });
  } catch (err) {
    console.error('[GET /api/bookings]', err);
    return Res.serverError();
  }
}

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

  try {
    const conflicts = await getOverlappingBookings(
        input.car_model,
        input.booking_date,
        input.start_time,
        input.end_time
    );
    if (conflicts.length > 0) return Res.conflict('SLOT_TAKEN');

    const booking = await createBooking(user.id, input);
    return Res.created({ booking });
  } catch (err) {
    console.error('[POST /api/bookings]', err);
    return Res.serverError();
  }
}