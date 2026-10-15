import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Agenda from '@/components/agenda/agenda';
import { findRequestForSession, type AccessRequestRow } from '@/lib/access/requests';
import { readSession, SESSION_COOKIE } from '@/lib/access/session';
import { hasSupabaseAdminConfig } from '@/lib/supabase/admin';

export const metadata: Metadata = { title: 'Agenda del curso' };
export const dynamic = 'force-dynamic';

/**
 * La agenda solo se sirve a quien tiene una solicitud APROBADA en la base de datos.
 * El middleware ya filtra por la cookie firmada, pero la decisión definitiva se toma aquí:
 * así, si se revoca un acceso, deja de funcionar al instante aunque la cookie siga viva.
 */
export default async function HomePage() {
  const session = await readSession(cookies().get(SESSION_COOKIE)?.value);
  if (!session) redirect('/acceso');

  if (!hasSupabaseAdminConfig()) {
    throw new Error('Falta la configuración de la base de datos para comprobar el acceso.');
  }

  let row: AccessRequestRow | null;
  try {
    row = await findRequestForSession(session);
  } catch (error) {
    console.error('Could not verify the access request before showing the agenda:', error);
    throw new Error('No se pudo comprobar el acceso en este momento.');
  }

  if (!row) redirect('/acceso?error=no_request');
  if (row.status !== 'approved') redirect('/solicitar-acceso');

  return <Agenda />;
}
