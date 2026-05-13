import { NextRequest } from 'next/server';
import { getAuthUser, Res } from '@/lib/auth';
import { getInstructorSchedule } from '@/models/instructor.model';

/**
 * GET /api/instructor/schedule?name=Метьолкін%20Олександр&from=YYYY-MM-DD&to=YYYY-MM-DD
 *
 * Replaces /api/instructor/:name — using a query param avoids Next.js
 * dynamic-segment issues with Cyrillic names that contain spaces.
 *
 * Query params:
 *   name  — "Прізвище Ім'я" (required, URL-encoded)
 *   from  — YYYY-MM-DD (optional, inclusive)
 *   to    — YYYY-MM-DD (optional, inclusive)
 *
 * Response 200: InstructorScheduleResponse (same shape as before)
 * Response 400: missing/invalid name
 * Response 404: no bookings found
 */
export async function GET(req: NextRequest) {
    const user = await getAuthUser(req);
    if (!user) return Res.unauthorized();

    const { searchParams } = new URL(req.url);

    // Name comes in as a plain query param — no path-segment encoding issues
    const name     = searchParams.get('name')?.trim() ?? '';
    const fromDate = searchParams.get('from') ?? undefined;
    const toDate   = searchParams.get('to')   ?? undefined;

    if (!name) {
        return Res.badRequest('name query param is required');
    }
    if (!name.includes(' ')) {
        return Res.badRequest('name must be "Прізвище Ім\'я" (space-separated)');
    }

    try {
        const schedule = await getInstructorSchedule(name, fromDate, toDate);
        if (!schedule) return Res.notFound('INSTRUCTOR_NOT_FOUND');
        return Res.ok(schedule);
    } catch (err) {
        console.error('[GET /api/instructor/schedule]', err);
        return Res.serverError();
    }
}