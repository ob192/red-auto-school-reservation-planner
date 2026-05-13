import { NextRequest } from 'next/server';
import { getAuthUser, Res } from '@/lib/auth';
import { getInstructorSchedule } from '@/models/instructor.model';

type Params = { params: Promise<{ name: string }> };

/**
 * GET /api/instructor/:name   (legacy — kept for backwards compat)
 *
 * Prefer GET /api/instructor/schedule?name=… for new callers.
 * Both routes share the same model function which now uses ILIKE,
 * so Cyrillic names work correctly on all Postgres locales.
 */
export async function GET(req: NextRequest, { params }: Params) {
  const user = await getAuthUser(req);
  if (!user) return Res.unauthorized();

  const { name } = await params;

  // decodeURIComponent handles %20 spaces and full Cyrillic sequences
  const instructorName = decodeURIComponent(name).trim();

  const { searchParams } = new URL(req.url);
  const fromDate = searchParams.get('from') ?? undefined;
  const toDate   = searchParams.get('to')   ?? undefined;

  if (!instructorName.includes(' ')) {
    return Res.badRequest('name must be "Прізвище Ім\'я" (space-separated)');
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