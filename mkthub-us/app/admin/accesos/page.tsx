import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import AdminQueue from '@/components/admin/admin-queue';
import { listRequests } from '@/lib/access/requests';
import type { AccessRequestRow } from '@/lib/access/types';
import { getAdminUser } from '@/lib/admin/guard';
import { hasSupabaseAdminConfig } from '@/lib/supabase/admin';

export const metadata: Metadata = { title: 'Solicitudes de acceso' };
export const dynamic = 'force-dynamic';

export default async function AdminAccessPage() {
  const admin = await getAdminUser();
  if (!admin) redirect('/admin/entrar');

  let requests: AccessRequestRow[] = [];
  let loadError = '';

  if (!hasSupabaseAdminConfig()) {
    loadError = 'Falta configurar la clave de servicio de Supabase en el servidor.';
  } else {
    try {
      requests = await listRequests();
    } catch (error) {
      console.error('Could not load access requests:', error);
      loadError = 'No se pudieron leer las solicitudes. Comprueba que has ejecutado la migración SQL de Supabase.';
    }
  }

  return <AdminQueue initialRequests={requests} loadError={loadError} adminEmail={admin.email} />;
}
