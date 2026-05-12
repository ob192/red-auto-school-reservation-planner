import { NextRequest } from 'next/server';
import { getAuthUser, Res } from '@/lib/auth';
import { listInstructors, getAllInstructorBookings } from '@/models/instructor.model';

/**
 * GET /api/instructor
 *
 * Returns a list of all distinct instructors who have at least one booking,
 * plus an optional flat table of all bookings across all instructors.
 *
 * Query params:
 *   all=true      — include flat booking table (default: false)
 *   from=YYYY-MM-DD
 *   to=YYYY-MM-DD
 *
 * Response 200:
 * {
 *   instructors: string[],
 *   bookings?: FlatBookingRow[]     // only when all=true
 * }
 */
export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return Res.unauthorized();

  const { searchParams } = new URL(req.url);
  const includeAll = searchParams.get('all') === 'true';
  const fromDate = searchParams.get('from') ?? undefined;
  const toDate = searchParams.get('to') ?? undefined;

  try {
    const instructors = await listInstructors();

    if (includeAll) {
      const bookings = await getAllInstructorBookings(fromDate, toDate);
      return Res.ok({ instructors, bookings });
    }

    return Res.ok({ instructors });
  } catch (err) {
    console.error('[GET /api/instructor]', err);
    return Res.serverError();
  }
}
