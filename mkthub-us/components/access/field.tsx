import type { ReactNode } from 'react';

export const inputClass =
  'h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-brand focus:ring-4 focus:ring-blue-100 aria-[invalid=true]:border-rose-400 aria-[invalid=true]:focus:ring-rose-100';

export const primaryButtonClass =
  'inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 text-sm font-extrabold text-white shadow-[0_5px_14px_rgba(49,88,219,0.18)] transition hover:bg-brand-dark disabled:cursor-wait disabled:opacity-60';

export const secondaryButtonClass =
  'inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60';

interface FieldProps {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}

/** Etiqueta + control + mensaje. El control debe llevar aria-describedby={`${id}-message`} cuando haya mensaje. */
export function Field({ id, label, error, hint, children }: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-bold text-slate-700">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-message`} role="alert" className="mt-1.5 text-sm font-semibold text-rose-700">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-message`} className="mt-1.5 text-xs text-slate-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
