import { isUuid } from '@/lib/access/session';
import { signToken, verifyToken } from '@/lib/access/tokens';

/** Los botones Aprobar/Denegar del correo valen 7 días. */
export const REVIEW_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface ReviewTokenPayload {
  requestId: string;
  email: string;
  requestedAt: string;
  expiresAt: number;
}

export function createReviewToken(input: Omit<ReviewTokenPayload, 'expiresAt'>): Promise<string> {
  return signToken({
    purpose: 'review',
    ...input,
    expiresAt: Date.now() + REVIEW_TOKEN_TTL_MS,
  });
}

export async function verifyReviewToken(token: string | undefined | null): Promise<ReviewTokenPayload | null> {
  const payload = await verifyToken(token);
  // "purpose" evita que una cookie de sesión sirva como enlace de revisión (y al revés).
  if (!payload || payload.purpose !== 'review') return null;

  const { requestId, email, requestedAt, expiresAt } = payload;
  if (
    !isUuid(requestId)
    || typeof email !== 'string'
    || !email.includes('@')
    || typeof requestedAt !== 'string'
    || !Number.isFinite(Date.parse(requestedAt))
    || typeof expiresAt !== 'number'
    || !Number.isFinite(expiresAt)
    || expiresAt <= Date.now()
  ) {
    return null;
  }

  return { requestId, email, requestedAt, expiresAt };
}
