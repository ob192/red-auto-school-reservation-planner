import { NextRequest } from 'next/server';
import { getAuthUser, Res } from '@/lib/auth';
import { getAllCars } from '@/models/car.model';

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return Res.unauthorized();
  return Res.ok({ cars: getAllCars() });
}