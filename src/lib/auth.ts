import * as jose from 'jose';
import { NextRequest } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

const JWKS = jose.createRemoteJWKSet(
    new URL(`${SUPABASE_URL}/auth/v1/.well-known/jwks.json`)
);

export interface AuthUser {
  id: string;
  email: string;
  fullName: string | null;
}

export async function getAuthUser(req: NextRequest): Promise<AuthUser | null> {
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return null;

  const token = auth.slice(7);

  try {
    const { payload } = await jose.jwtVerify(token, JWKS, {
      issuer: `${SUPABASE_URL}/auth/v1`,
    });

    return {
      id: payload.sub!,
      email: (payload['email'] as string) ?? '',
      fullName: (payload['user_metadata'] as Record<string, string> | undefined)?.full_name ?? null,
    };
  } catch (err) {
    console.error('[auth] JWT verify failed:', err);
    return null;
  }
}

/** Standard error responses */
export const Res = {
  unauthorized: () =>
      Response.json({ error: 'NOT_AUTHENTICATED' }, { status: 401 }),
  forbidden: () =>
      Response.json({ error: 'FORBIDDEN' }, { status: 403 }),
  notFound: (msg = 'NOT_FOUND') =>
      Response.json({ error: msg }, { status: 404 }),
  conflict: (msg = 'CONFLICT') =>
      Response.json({ error: msg }, { status: 409 }),
  badRequest: (msg: string, issues?: unknown) =>
      Response.json({ error: msg, ...(issues ? { issues } : {}) }, { status: 400 }),
  serverError: (msg = 'INTERNAL_SERVER_ERROR') =>
      Response.json({ error: msg }, { status: 500 }),
  ok: (data: unknown, status = 200) =>
      Response.json(data, { status }),
  created: (data: unknown) =>
      Response.json(data, { status: 201 }),
};