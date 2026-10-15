import type { NextRequest } from 'next/server';
import { attachSession, clientIp, jsonNoStore } from '@/lib/access/http';
import { findRequestByEmail } from '@/lib/access/requests';
import { ClaimSchema, usernameKey } from '@/lib/access/schemas';
import { createSessionToken } from '@/lib/access/session';
import { rateLimit } from '@/lib/rate-limit';
import { hasSupabaseAdminConfig } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const NOT_FOUND_MESSAGE = 'No encontramos una solicitud con esos datos. Revisa el correo y el nombre de usuario.';

/**
 * Recupera una solicitud ya enviada: une este navegador con ella usando el mismo correo y el mismo
 * nombre de usuario. No modifica la solicitud ni envía ningún correo; la aprobación sigue siendo manual.
 */
export async function POST(request: NextRequest) {
  if (!rateLimit(`claim:${clientIp(request)}`, 10, 10 * 60 * 1000)) {
    return jsonNoStore({ message: 'Demasiados intentos. Espera unos minutos y vuelve a probar.' }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonNoStore({ message: 'Escribe el correo y el nombre de usuario de la solicitud.' }, { status: 400 });
  }

  const parsed = ClaimSchema.safeParse(body);
  if (!parsed.success) {
    return jsonNoStore(
      {
        message: parsed.error.issues[0]?.message || 'Revisa el correo y el nombre de usuario.',
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }
  if (!hasSupabaseAdminConfig()) {
    return jsonNoStore({ message: 'El registro todavía no está configurado. Inténtalo más tarde.' }, { status: 503 });
  }

  try {
    // Se busca por correo (único) y el nombre de usuario se compara en código: exacto, sin comodines de SQL.
    const row = await findRequestByEmail(parsed.data.email);
    const matches = row && row.username && usernameKey(row.username) === usernameKey(parsed.data.username);
    if (!row || !matches) return jsonNoStore({ message: NOT_FOUND_MESSAGE }, { status: 404 });

    if (row.status === 'denied') {
      return jsonNoStore(
        { message: 'La solicitud no fue aprobada. Contacta con administración si necesitas revisarla.' },
        { status: 403 },
      );
    }

    const status = row.status === 'approved' ? 'approved' : 'pending';
    const token = await createSessionToken({
      requestId: row.user_id,
      email: row.email.toLowerCase(),
      requestedAt: row.requested_at,
      status,
    });
    return attachSession(jsonNoStore({ status }), token, request);
  } catch (error) {
    console.error('Access session recovery failed:', error);
    return jsonNoStore({ message: 'No se pudo recuperar la solicitud. Inténtalo de nuevo.' }, { status: 503 });
  }
}
