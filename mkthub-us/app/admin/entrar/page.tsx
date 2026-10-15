import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import AdminLoginForm from '@/components/admin/admin-login-form';
import { AccessShell } from '@/components/access/shell';
import { getAdminUser } from '@/lib/admin/guard';
import { getSupabasePublicConfig } from '@/lib/supabase/config';

export const metadata: Metadata = { title: 'Administración' };
export const dynamic = 'force-dynamic';

export default async function AdminLoginPage({ searchParams }: { searchParams: { error?: string } }) {
  const configured = Boolean(getSupabasePublicConfig());
  if (configured && (await getAdminUser())) redirect('/admin/accesos');

  return (
    <AccessShell subtitle="Administración" badge="Solo administración" size="sm">
      <AdminLoginForm configured={configured} errorCode={searchParams.error} />
    </AccessShell>
  );
}
