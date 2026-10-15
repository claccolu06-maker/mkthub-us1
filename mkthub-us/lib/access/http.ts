import { NextResponse } from 'next/server';
import { SESSION_COOKIE, sessionCookieOptions } from '@/lib/access/session';

export function jsonNoStore(body: unknown, init?: ResponseInit): NextResponse {
  const response = NextResponse.json(body, init);
  response.headers.set('Cache-Control', 'no-store');
  return response;
}

export function clientIp(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
}

function isHttps(request: Request): boolean {
  return request.headers.get('x-forwarded-proto') === 'https' || new URL(request.url).protocol === 'https:';
}

export function attachSession(response: NextResponse, token: string, request: Request): NextResponse {
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(isHttps(request)));
  return response;
}

export function clearSession(response: NextResponse, request: Request): NextResponse {
  response.cookies.set(SESSION_COOKIE, '', { ...sessionCookieOptions(isHttps(request)), maxAge: 0 });
  return response;
}
