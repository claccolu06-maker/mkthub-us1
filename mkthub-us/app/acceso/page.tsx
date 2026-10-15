import type { Metadata } from 'next';
import AccessForm from '@/components/access/access-form';
import { AccessShell } from '@/components/access/shell';
import { hasSupabaseAdminConfig } from '@/lib/supabase/admin';

export const metadata: Metadata = {
  title: 'Acceso privado',
  description: 'Solicita acceso al grupo piloto de Marketing de MktHub US.',
};

export const dynamic = 'force-dynamic';

const NOTICES: Record<string, string> = {
  no_request: 'No encontramos tu solicitud. Recupérala con tus datos o rellena el formulario.',
};

export default function AccessPage({ searchParams }: { searchParams: { modo?: string; error?: string } }) {
  const ready = hasSupabaseAdminConfig();
  const initialMode = searchParams.modo === 'recuperar' ? 'recover' : 'register';

  return (
    <AccessShell subtitle="Grupo piloto · Marketing">
      {ready ? (
        <AccessForm key={initialMode} initialMode={initialMode} notice={NOTICES[searchParams.error ?? ''] ?? ''} />
      ) : (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5" role="status">
          <h1 className="text-lg font-extrabold text-amber-950">Registro pendiente de configuración</h1>
          <p className="mt-2 text-sm leading-6 text-amber-900/90">
            Esta página todavía no está lista para recibir solicitudes. Vuelve a intentarlo más tarde y no escribas aquí la contraseña de tu correo.
          </p>
        </div>
      )}
    </AccessShell>
  );
}
