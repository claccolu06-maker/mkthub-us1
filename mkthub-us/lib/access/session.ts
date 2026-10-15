import { signToken, verifyToken } from '@/lib/access/tokens';

/** Cookie HttpOnly que une este navegador con una solicitud de acceso concreta. */
export const SESSION_COOKIE = 'mkthub_access_session';
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 180;

export type RequestStatus = 'pending' | 'approved' | 'denied';

export interface AccessSession {
  /** Identificador de la solicitud (columna user_id de access_requests). */
  requestId: string;
  email: string;
  requestedAt: string;
  status: RequestStatus;
  expiresAt: number;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_PATTERN.test(value);
}

export function isRequestStatus(value: unknown): value is RequestStatus {
  return value === 'pending' || value === 'approved' || value === 'denied';
}

export function createSessionToken(input: Omit<AccessSession, 'expiresAt'>): Promise<string> {
  return signToken({
    purpose: 'session',
    ...input,
    expiresAt: Date.now() + SESSION_MAX_AGE_SECONDS * 1000,
  });
}

export async function readSession(token: string | undefined | null): Promise<AccessSession | null> {
  const payload = await verifyToken(token);
  if (!payload || payload.purpose !== 'session') return null;

  const { requestId, email, requestedAt, status, expiresAt } = payload;
  if (
    !isUuid(requestId)
    || typeof email !== 'string'
    || !email.includes('@')
    || email !== email.toLowerCase()
    || typeof requestedAt !== 'string'
    || !Number.isFinite(Date.parse(requestedAt))
    || !isRequestStatus(status)
    || typeof expiresAt !== 'number'
    || !Number.isFinite(expiresAt)
    || expiresAt <= Date.now()
  ) {
    return null;
  }

  return { requestId, email, requestedAt, status, expiresAt };
}

export function sessionCookieOptions(secure: boolean) {
  return {
    httpOnly: true,
    secure,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}
