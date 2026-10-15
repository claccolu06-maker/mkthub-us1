import type { ReactNode } from 'react';

export function BrandMark({ className = 'h-10 w-10 text-sm' }: { className?: string }) {
  return (
    <span className={`flex shrink-0 items-center justify-center rounded-xl bg-brand font-black text-white shadow-sm shadow-blue-200 ${className}`} aria-hidden="true">
      M
    </span>
  );
}

interface AccessShellProps {
  children: ReactNode;
  /** Texto pequeño bajo el nombre de la marca. */
  subtitle?: string;
  /** Texto de la etiqueta de la derecha de la cabecera. */
  badge?: string;
  /** Ancho máximo de la tarjeta. */
  size?: 'sm' | 'md' | 'lg';
}

const WIDTHS = { sm: 'max-w-[460px]', md: 'max-w-[520px]', lg: 'max-w-[760px]' } as const;

/** Marco común de las pantallas de acceso y administración: misma cabecera que el banner de la agenda. */
export function AccessShell({ children, subtitle = '3º · Marketing', badge = 'Acceso privado', size = 'md' }: AccessShellProps) {
  return (
    <main className="flex min-h-screen items-start justify-center px-4 py-8 sm:items-center sm:py-12">
      <section className={`w-full overflow-hidden rounded-3xl border border-white/80 bg-white shadow-soft ${WIDTHS[size]}`}>
        <header className="flex items-center gap-3 border-b border-blue-100/70 bg-[linear-gradient(112deg,#e7efff_0%,#edf2ff_48%,#f5efff_100%)] px-5 py-4 sm:px-7">
          <BrandMark />
          <div className="min-w-0">
            <p className="text-base font-extrabold leading-tight tracking-tight text-ink">
              MktHub <span className="text-brand">US</span>
            </p>
            <p className="text-xs font-medium text-slate-500">{subtitle}</p>
          </div>
          <span className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-full border border-blue-100 bg-white/80 px-3 py-1.5 text-xs font-bold text-slate-600">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
            {badge}
          </span>
        </header>
        <div className="p-5 sm:p-7">{children}</div>
      </section>
    </main>
  );
}
