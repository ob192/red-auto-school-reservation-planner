import { NextRequest } from 'next/server';
import { getAuthUser, Res } from '@/lib/auth';
import { getInstructorSchedule } from '@/models/instructor.model';

type Params = { params: Promise<{ name: string }> };

/**
 * GET /api/instructor/:name
 *
 * Returns the full schedule for a single instructor, grouped by car → month,
 * mirroring the Python write_to_sheets logic.
 *
 * :name  — URL-encoded "Іваненко Петро" (last + space + first)
 *
 * Query params:
 *   from=YYYY-MM-DD   (optional, inclusive)
 *   to=YYYY-MM-DD     (optional, inclusive)
 *
 * Response 200:
 * {
 *   instructor: string,
 *   grand_total_hours: number,
 *   cars: [
 *     {
 *       car_name: string,
 *       total_hours: number,
 *       months: [
 *         {
 *           month: "YYYY-MM",
 *           total_hours: number,
 *           bookings: [
 *             {
 *               id, car_name, car_color,
 *               booking_date, start_time, end_time,
 *               duration_hours, status
 *             }
 *           ]
 *         }
 *       ]
 *     }
 *   ]
 * }
 *
 * Response 404: instructor has no bookings (or doesn't exist)
 *
 * Example:
 *   GET /api/instructor/%D0%86%D0%B2%D0%B0%D0%BD%D0%B5%D0%BD%D0%BA%D0%BE%20%D0%9F%D0%B5%D1%82%D1%80%D0%BE
 *   → /api/instructor/Іваненко Петро
 */
export async function GET(req: NextRequest, { params }: Params) {
  const user = await getAuthUser(req);
  if (!user) return Res.unauthorized();

  const { name } = await params;
  const instructorName = decodeURIComponent(name);

  const { searchParams } = new URL(req.url);
  const fromDate = searchParams.get('from') ?? undefined;
  const toDate = searchParams.get('to') ?? undefined;

  if (!instructorName.includes(' ')) {
    return Res.badRequest('name must be "LastName FirstName" (space-separated)');
  }

  try {
    const schedule = await getInstructorSchedule(instructorName, fromDate, toDate);
    if (!schedule) return Res.notFound('INSTRUCTOR_NOT_FOUND');
    return Res.ok(schedule);
  } catch (err) {
    console.error(`[GET /api/instructor/${instructorName}]`, err);
    return Res.serverError();
  }
}
