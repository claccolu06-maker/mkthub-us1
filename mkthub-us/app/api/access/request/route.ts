import type { NextRequest } from 'next/server';
import { isApprover } from '@/lib/access/approver';
import { attachSession, clientIp, jsonNoStore } from '@/lib/access/http';
import { notifyAdminOfRequest } from '@/lib/access/notify';
import { createRequest, findRequestByEmail, updatePendingProfile, type AccessRequestRow } from '@/lib/access/requests';
import { RegistrationFormSchema } from '@/lib/access/schemas';
import { createSessionToken, readSession, SESSION_COOKIE } from '@/lib/access/session';
import { rateLimit } from '@/lib/rate-limit';
import { getSiteUrl } from '@/lib/site-url';
import { hasSupabaseAdminConfig } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
// El envío por SMTP puede tardar; se da margen para que la función no se corte a los 10 s.
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  if (!rateLimit(`request:${clientIp(request)}`, 8, 60 * 60 * 1000)) {
    return jsonNoStore({ message: 'Demasiados intentos. Espera un rato y vuelve a probar.' }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonNoStore({ message: 'Completa todos los campos del formulario.' }, { status: 400 });
  }

  // Campo trampa: las personas no lo ven ni lo rellenan; muchos bots sí.
  const honeypot = (body as { website?: unknown } | null)?.website;
  if (typeof honeypot === 'string' && honeypot.trim()) {
    return jsonNoStore({ message: 'No se pudo enviar la solicitud.' }, { status: 400 });
  }

  const parsed = RegistrationFormSchema.safeParse(body);
  if (!parsed.success) {
    return jsonNoStore(
      {
        message: parsed.error.issues[0]?.message || 'Revisa los datos del formulario.',
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const { email, ...profile } = parsed.data;
  if (isApprover(email)) {
    return jsonNoStore(
      { message: 'Ese es el correo de administración. Usa otro correo para la solicitud de estudiante.' },
      { status: 400 },
    );
  }
  if (!hasSupabaseAdminConfig()) {
    return jsonNoStore({ message: 'El registro todavía no está configurado. Inténtalo más tarde.' }, { status: 503 });
  }

  try {
    const existing = await findRequestByEmail(email);
    let row: AccessRequestRow;

    if (existing) {
      if (existing.status === 'denied') {
        return jsonNoStore(
          {
            status: 'denied',
            message: 'La solicitud anterior no fue aprobada. Contacta con administración si necesitas revisarla.',
          },
          { status: 403 },
        );
      }

      // Solo el navegador que envió la solicitud puede reenviarla o editarla. Cualquier otro, aunque conozca
      // el correo, debe demostrar el nombre de usuario con «Ya envié mi solicitud».
      const session = await readSession(request.cookies.get(SESSION_COOKIE)?.value);
      const isSameBrowser = session?.requestId === existing.user_id && session.email === existing.email.toLowerCase();
      if (!isSameBrowser) {
        return jsonNoStore(
          {
            message:
              existing.status === 'approved'
                ? 'Este correo ya tiene una solicitud aprobada. Usa «Ya envié mi solicitud» con tu correo y tu nombre de usuario para entrar desde este navegador.'
                : 'Este correo ya tiene una solicitud enviada. Usa «Ya envié mi solicitud» con tu correo y tu nombre de usuario para ver su estado desde este navegador.',
            recover: true,
          },
          { status: 409 },
        );
      }

      if (existing.status === 'approved') {
        const token = await createSessionToken({
          requestId: existing.user_id,
          email: existing.email.toLowerCase(),
          requestedAt: existing.requested_at,
          status: 'approved',
        });
        return attachSession(jsonNoStore({ status: 'approved' }), token, request);
      }

      // Sigue pendiente: se pueden corregir los datos, pero la fecha original de la solicitud no cambia.
      row = (await updatePendingProfile(existing.user_id, profile)) ?? existing;
    } else {
      row = (await createRequest(email, profile)).row;
    }

    // Se avisa a administración solo si todavía no se ha conseguido avisar (reintento idempotente).
    let notified = Boolean(row.admin_notified_at);
    if (!notified) {
      const notice = await notifyAdminOfRequest(row, getSiteUrl(request));
      notified = notice.ok;
    }

    const token = await createSessionToken({
      requestId: row.user_id,
      email: row.email.toLowerCase(),
      requestedAt: row.requested_at,
      status: 'pending',
    });
    return attachSession(jsonNoStore({ status: 'pending', notified }, { status: existing ? 200 : 201 }), token, request);
  } catch (error) {
    console.error('Access request submission failed:', error);
    return jsonNoStore({ message: 'No se pudo guardar la solicitud. Espera un momento y vuelve a intentarlo.' }, { status: 503 });
  }
}
