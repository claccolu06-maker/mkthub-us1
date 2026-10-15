import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { jsonNoStore } from '@/lib/access/http';
import { MAIL_ISSUE_HINTS } from '@/lib/access/mail-issues';
import { notifyAdminOfRequest } from '@/lib/access/notify';
import { findRequestById } from '@/lib/access/requests';
import { getAdminUser } from '@/lib/admin/guard';
import { getSiteUrl } from '@/lib/site-url';

export const dynamic = 'force-dynamic';
// El envío por SMTP puede tardar; se da margen para que la función no se corte a los 10 s.
export const maxDuration = 30;

const BodySchema = z.object({ requestId: z.string().uuid() });

/**
 * Reintento administrativo del aviso por correo de una solicitud pendiente.
 * No modifica la solicitud ni exige que el alumnado vuelva a enviar nada.
 */
export async function POST(request: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) return jsonNoStore({ message: 'No tienes permiso para hacer esto.' }, { status: 403 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonNoStore({ message: 'La petición no es válida.' }, { status: 400 });
  }
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) return jsonNoStore({ message: 'La petición no es válida.' }, { status: 400 });

  try {
    const row = await findRequestById(parsed.data.requestId);
    if (!row) return jsonNoStore({ message: 'La solicitud no existe.' }, { status: 404 });
    if (row.status !== 'pending') {
      return jsonNoStore({ message: 'Esta solicitud ya está revisada: no hace falta avisar.' }, { status: 409 });
    }

    const result = await notifyAdminOfRequest(row, getSiteUrl(request));
    if (result.ok) return jsonNoStore({ sent: true, message: 'Aviso enviado al correo de administración.' });

    return jsonNoStore(
      {
        sent: false,
        issue: result.issue,
        code: result.code,
        missing: result.missing,
        message: result.issue ? MAIL_ISSUE_HINTS[result.issue] : 'No se pudo enviar el aviso.',
      },
      { status: 502 },
    );
  } catch (error) {
    console.error('Admin notification retry failed:', error);
    return jsonNoStore({ message: 'No se pudo reenviar el aviso.' }, { status: 503 });
  }
}
