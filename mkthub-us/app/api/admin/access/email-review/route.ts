import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { jsonNoStore } from '@/lib/access/http';
import { decideFromEmail } from '@/lib/access/requests';
import { verifyReviewToken } from '@/lib/access/review-token';
import { hasSupabaseAdminConfig } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const BodySchema = z.object({
  token: z.string().min(20).max(4096),
  status: z.enum(['approved', 'denied']),
});

/** Decisión desde el enlace del correo. La firma del enlace es la credencial: no hace falta iniciar sesión. */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonNoStore({ message: 'La decisión no es válida.' }, { status: 400 });
  }
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) return jsonNoStore({ message: 'La decisión no es válida.' }, { status: 400 });

  const payload = await verifyReviewToken(parsed.data.token);
  if (!payload) return jsonNoStore({ message: 'El enlace de revisión no es válido o ha caducado.' }, { status: 401 });
  if (!hasSupabaseAdminConfig()) return jsonNoStore({ message: 'El servicio no está configurado.' }, { status: 503 });

  try {
    const outcome = await decideFromEmail(payload, parsed.data.status);

    if (outcome.result === 'not_found') {
      return jsonNoStore({ message: 'La solicitud ya no existe o el enlace ya no corresponde a ella.' }, { status: 404 });
    }
    if (outcome.result === 'conflict') {
      const label = outcome.row.status === 'approved' ? 'aprobada' : 'denegada';
      return jsonNoStore({ message: `Esta solicitud ya se había ${label}. Puedes cambiarla desde el panel.`, current: outcome.row.status }, { status: 409 });
    }

    const approved = parsed.data.status === 'approved';
    return jsonNoStore({
      status: parsed.data.status,
      alreadyDecided: outcome.result === 'already',
      message: approved ? 'Solicitud aprobada. La persona entrará a la agenda en unos segundos.' : 'Solicitud denegada.',
    });
  } catch (error) {
    console.error('Email access review failed:', error);
    return jsonNoStore({ message: 'No se pudo guardar la decisión. Inténtalo desde el panel de administración.' }, { status: 503 });
  }
}
