import Link from 'next/link';
import { AccessShell } from '@/components/access/shell';
import { secondaryButtonClass } from '@/components/access/field';

export default function NotFound() {
  return (
    <AccessShell subtitle="3º · Marketing" badge="Error 404">
      <h1 className="text-xl font-extrabold text-ink">Esta página no existe</h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">Puede que el enlace esté mal escrito o que ya no esté disponible.</p>
      <Link href="/" className={`${secondaryButtonClass} mt-5 w-full`}>
        Ir al inicio
      </Link>
    </AccessShell>
  );
}
