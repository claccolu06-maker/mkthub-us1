import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AccessShell } from '@/components/access/shell';
import StatusViewPanel from '@/components/access/status-view';
import { findRequestForSession, type AccessRequestRow } from '@/lib/access/requests';
import { readSession, SESSION_COOKIE } from '@/lib/access/session';
import { hasSupabaseAdminConfig } from '@/lib/supabase/admin';

export const metadata: Metadata = { title: 'Estado de tu solicitud' };
export const dynamic = 'force-dynamic';

export default async function RequestStatusPage() {
  const session = await readSession(cookies().get(SESSION_COOKIE)?.value);
  if (!session) redirect('/acceso?modo=recuperar');

  let row: AccessRequestRow | null = null;
  let lookupFailed = !hasSupabaseAdminConfig();

  if (!lookupFailed) {
    try {
      row = await findRequestForSession(session);
    } catch (error) {
      console.error('Could not load the applicant access status:', error);
      lookupFailed = true;
    }
  }

  // Si la base de datos responde pero la solicitud ya no existe, se ofrece recuperarla.
  if (!lookupFailed && !row) redirect('/acceso?error=no_request');

  return (
    <AccessShell subtitle="Grupo piloto · Marketing" badge="Solicitud">
      <StatusViewPanel
        email={session.email}
        initialStatus={row?.status ?? 'unavailable'}
        initialNotified={Boolean(row?.admin_notified_at)}
      />
    </AccessShell>
  );
}
