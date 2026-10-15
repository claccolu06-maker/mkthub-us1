import type { NextRequest } from 'next/server';
import { clearSession, jsonNoStore } from '@/lib/access/http';

export const dynamic = 'force-dynamic';

/** Cierra la sesión de este navegador. No borra ni cambia la solicitud. */
export async function POST(request: NextRequest) {
  return clearSession(jsonNoStore({ ok: true }), request);
}
