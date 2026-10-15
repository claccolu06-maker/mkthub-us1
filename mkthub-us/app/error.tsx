'use client';

import { RefreshCw, TriangleAlert } from 'lucide-react';
import { AccessShell } from '@/components/access/shell';
import { secondaryButtonClass } from '@/components/access/field';

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <AccessShell subtitle="3º · Marketing" badge="Aviso">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5" role="alert">
        <div className="flex items-center gap-2.5 text-lg font-extrabold text-amber-950">
          <TriangleAlert className="h-5 w-5 shrink-0" aria-hidden="true" />
          No hemos podido cargar la página
        </div>
        <p className="mt-2 text-sm leading-6 text-amber-900/90">
          Ha ocurrido un problema temporal al comprobar tu acceso. Tus datos no se han perdido. Vuelve a intentarlo en unos segundos.
        </p>
      </div>
      <button type="button" onClick={reset} className={`${secondaryButtonClass} mt-5 w-full`}>
        <RefreshCw className="h-4 w-4" aria-hidden="true" />
        Volver a intentarlo
      </button>
    </AccessShell>
  );
}
