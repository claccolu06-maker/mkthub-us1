import type { Metadata } from 'next';
import Link from 'next/link';
import { AccessShell } from '@/components/access/shell';
import ReviewDecision from '@/components/admin/review-decision';
import { findRequestById, type AccessRequestRow } from '@/lib/access/requests';
import { verifyReviewToken } from '@/lib/access/review-token';
import { hasSupabaseAdminConfig } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Revisar solicitud', robots: { index: false, follow: false } };

function Message({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <AccessShell subtitle="Revisión de acceso" badge="Administración" size="sm">
      <h1 className="text-xl font-extrabold text-ink">{title}</h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">{children}</p>
      <Link href="/admin/accesos" className="mt-5 inline-flex h-10 items-center justify-center rounded-xl bg-brand px-4 text-sm font-extrabold text-white hover:bg-brand-dark">
        Abrir el panel de solicitudes
      </Link>
    </AccessShell>
  );
}

const STATUS_LABELS = { approved: 'aprobada', denied: 'denegada' } as const;

export default async function ReviewPage({ searchParams }: { searchParams: { token?: string; decision?: string } }) {
  const token = searchParams.token?.trim();
  const payload = token ? await verifyReviewToken(token) : null;
  if (!token || !payload) {
    return <Message title="Este enlace ya no es válido">Puede haber caducado o no ser correcto. Abre el panel para ver las solicitudes pendientes.</Message>;
  }
  if (!hasSupabaseAdminConfig()) {
    return <Message title="Servicio sin configurar">Faltan las claves de Supabase en este entorno.</Message>;
  }

  let row: AccessRequestRow | null = null;
  try {
    row = await findRequestById(payload.requestId);
  } catch (error) {
    console.error('Admin email review page failed:', error);
    return <Message title="No se pudo cargar la solicitud">Inténtalo de nuevo en un momento o revísala desde el panel.</Message>;
  }

  const sameRequest = row && row.email.toLowerCase() === payload.email.toLowerCase() && Date.parse(row.requested_at) === Date.parse(payload.requestedAt);
  if (!row || !sameRequest) {
    return <Message title="Este enlace ya no es válido">La solicitud ya no existe o el enlace no corresponde a ella.</Message>;
  }
  if (row.status !== 'pending') {
    return (
      <Message title={`Esta solicitud ya está ${STATUS_LABELS[row.status as 'approved' | 'denied']}`}>
        Ya se tomó una decisión sobre @{row.username || row.email}. Si quieres cambiarla, hazlo desde el panel.
      </Message>
    );
  }

  const suggested = searchParams.decision === 'approved' || searchParams.decision === 'denied' ? searchParams.decision : null;
  return (
    <AccessShell subtitle="Revisión de acceso" badge="Administración" size="md">
      <ReviewDecision token={token} request={row} suggested={suggested} />
    </AccessShell>
  );
}
