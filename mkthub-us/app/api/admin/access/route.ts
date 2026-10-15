import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { jsonNoStore } from '@/lib/access/http';
import { findRequestById, hasCompleteProfile, setRequestStatus } from '@/lib/access/requests';
import { getAdminUser } from '@/lib/admin/guard';

export const dynamic = 'force-dynamic';

const DecisionSchema = z.object({
  requestId: z.string().uuid(),
  status: z.enum(['approved', 'denied']),
});

/** Aprobar o denegar desde el panel. También permite revocar una aprobación o reconsiderar una denegación. */
export async function PATCH(request: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) return jsonNoStore({ message: 'No tienes permiso para revisar solicitudes.' }, { status: 403 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonNoStore({ message: 'La decisión no es válida.' }, { status: 400 });
  }
  const parsed = DecisionSchema.safeParse(body);
  if (!parsed.success) return jsonNoStore({ message: 'La decisión no es válida.' }, { status: 400 });

  try {
    const current = await findRequestById(parsed.data.requestId);
    if (!current) return jsonNoStore({ message: 'La solicitud no existe.' }, { status: 404 });
    if (parsed.data.status === 'approved' && !hasCompleteProfile(current)) {
      return jsonNoStore({ message: 'No se puede aprobar todavía: faltan datos del registro.' }, { status: 400 });
    }

    const updated = await setRequestStatus(parsed.data.requestId, parsed.data.status, admin.id);
    if (!updated) return jsonNoStore({ message: 'La solicitud no existe.' }, { status: 404 });

    return jsonNoStore({
      status: updated.status,
      reviewedAt: updated.reviewed_at,
      message: updated.status === 'approved' ? 'Solicitud aprobada.' : 'Solicitud denegada.',
    });
  } catch (error) {
    console.error('Admin access review failed:', error);
    return jsonNoStore({ message: 'No se pudo guardar la decisión.' }, { status: 503 });
  }
}
