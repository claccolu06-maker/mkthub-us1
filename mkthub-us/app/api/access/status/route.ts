import type { NextRequest } from 'next/server';
import { attachSession, clearSession, jsonNoStore } from '@/lib/access/http';
import { findRequestForSession } from '@/lib/access/requests';
import { createSessionToken, readSession, SESSION_COOKIE } from '@/lib/access/session';
import { hasSupabaseAdminConfig } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

/**
 * Estado actual de la solicitud ligada a este navegador. Cada consulta renueva la cookie con el
 * estado real: cuando administración aprueba, la siguiente consulta deja pasar a la agenda.
 */
export async function GET(request: NextRequest) {
  const session = await readSession(request.cookies.get(SESSION_COOKIE)?.value);
  if (!session) {
    return clearSession(jsonNoStore({ message: 'La sesión de solicitud ha caducado.' }, { status: 401 }), request);
  }
  if (!hasSupabaseAdminConfig()) {
    return jsonNoStore({ message: 'No se pudo comprobar el estado de la solicitud.' }, { status: 503 });
  }

  try {
    const row = await findRequestForSession(session);
    if (!row) {
      return clearSession(jsonNoStore({ message: 'No se pudo localizar la solicitud.' }, { status: 404 }), request);
    }

    const token = await createSessionToken({
      requestId: row.user_id,
      email: row.email.toLowerCase(),
      requestedAt: row.requested_at,
      status: row.status,
    });
    return attachSession(jsonNoStore({ status: row.status, notified: Boolean(row.admin_notified_at) }), token, request);
  } catch (error) {
    console.error('Could not refresh access status:', error);
    return jsonNoStore({ message: 'No se pudo comprobar el estado de la solicitud.' }, { status: 503 });
  }
}
