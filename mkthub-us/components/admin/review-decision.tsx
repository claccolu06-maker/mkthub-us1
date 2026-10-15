'use client';

import { useState } from 'react';
import { Check, Loader2, X } from 'lucide-react';
import { COURSE_LABELS, SHIFT_LABELS } from '@/lib/access/schemas';
import { formatDateTime } from '@/lib/academic';

type Decision = 'approved' | 'denied';

export interface ReviewRequest {
  email: string;
  username: string | null;
  full_name: string | null;
  course: string | null;
  shift: string | null;
  reason: string | null;
  requested_at: string;
}

export default function ReviewDecision({
  token,
  request,
  suggested,
}: {
  token: string;
  request: ReviewRequest;
  suggested: Decision | null;
}) {
  const [working, setWorking] = useState<Decision | null>(null);
  const [completed, setCompleted] = useState<Decision | null>(null);
  const [message, setMessage] = useState('');

  async function decide(status: Decision) {
    setWorking(status);
    setMessage('');
    try {
      const response = await fetch('/api/admin/access/email-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, status }),
      });
      const body = (await response.json().catch(() => ({}))) as { message?: string };
      if (!response.ok) {
        setMessage(body.message || 'No se pudo guardar la decisión. El enlace puede haber caducado.');
        return;
      }
      setCompleted(status);
      setMessage(body.message || 'Decisión guardada.');
    } catch {
      setMessage('No se pudo conectar con MktHub US. Comprueba la conexión e inténtalo de nuevo.');
    } finally {
      setWorking(null);
    }
  }

  if (completed) {
    const approved = completed === 'approved';
    return (
      <div className={`rounded-2xl border p-5 ${approved ? 'border-emerald-200 bg-emerald-50 text-emerald-950' : 'border-rose-200 bg-rose-50 text-rose-950'}`} role="status">
        <div className="flex items-center gap-2 text-lg font-extrabold">
          {approved ? <Check className="h-5 w-5" aria-hidden="true" /> : <X className="h-5 w-5" aria-hidden="true" />}
          {approved ? 'Solicitud aprobada' : 'Solicitud denegada'}
        </div>
        <p className="mt-2 text-sm leading-6">{message}</p>
        <p className="mt-3 text-xs leading-5 opacity-80">La decisión ya está guardada y puedes cerrar esta pestaña.</p>
      </div>
    );
  }

  const hint =
    suggested === 'approved' ? 'Has abierto la opción «Aprobar». Confírmala o elige otra.'
    : suggested === 'denied' ? 'Has abierto la opción «Denegar». Confírmala o elige otra.'
    : 'Revisa los datos y elige una decisión.';

  const row = (label: string, value: string) => (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
      <dt className="w-24 shrink-0 text-sm font-semibold text-slate-500">{label}</dt>
      <dd className="min-w-0 break-words text-sm font-bold text-ink">{value}</dd>
    </div>
  );

  return (
    <>
      <h1 className="text-2xl font-extrabold tracking-tight text-ink">Revisar solicitud</h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">{hint} Este enlace es privado, caduca a los 7 días y no pide iniciar sesión.</p>

      <dl className="mt-5 space-y-2.5 rounded-2xl border border-slate-100 bg-slate-50 p-4">
        {row('Usuario', request.username ? `@${request.username}` : 'No indicado')}
        {row('Nombre', request.full_name || 'No indicado')}
        {row('Correo', request.email)}
        {row('Curso', request.course ? COURSE_LABELS[request.course] ?? request.course : 'No indicado')}
        {row('Turno', request.shift ? SHIFT_LABELS[request.shift] ?? request.shift : 'No indicado')}
        {row('Solicitada', formatDateTime(request.requested_at))}
        <div className="rounded-xl bg-white p-3">
          <dt className="text-xs font-bold text-slate-500">Presentación</dt>
          <dd className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{request.reason || 'No se aportó una presentación.'}</dd>
        </div>
      </dl>

      {message && (
        <p role="alert" className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-sm font-semibold text-amber-900">
          {message}
        </p>
      )}

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          type="button"
          disabled={working !== null}
          onClick={() => decide('denied')}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-4 text-sm font-extrabold text-rose-800 hover:bg-rose-50 disabled:opacity-60"
        >
          {working === 'denied' ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <X className="h-4 w-4" aria-hidden="true" />}
          {working === 'denied' ? 'Guardando…' : 'Confirmar denegación'}
        </button>
        <button
          type="button"
          disabled={working !== null}
          onClick={() => decide('approved')}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand px-4 text-sm font-extrabold text-white hover:bg-brand-dark disabled:opacity-60"
        >
          {working === 'approved' ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Check className="h-4 w-4" aria-hidden="true" />}
          {working === 'approved' ? 'Guardando…' : 'Confirmar aprobación'}
        </button>
      </div>
    </>
  );
}
