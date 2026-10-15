'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Clock3, Loader2, LogOut, Mail, RefreshCw, TriangleAlert, X } from 'lucide-react';
import { secondaryButtonClass } from '@/components/access/field';

export type StatusView = 'pending' | 'approved' | 'denied' | 'unavailable';

interface StatusBody {
  status?: 'pending' | 'approved' | 'denied';
  notified?: boolean;
  message?: string;
}

const COPY: Record<StatusView, { title: string; description: string; tone: string; icon: typeof Clock3 }> = {
  pending: {
    title: 'Solicitud recibida',
    description:
      'La persona administradora revisará tus datos. Cuando la apruebe, entrarás a la agenda desde este mismo navegador: puedes dejar esta pestaña abierta o volver más tarde.',
    tone: 'border-amber-200 bg-amber-50 text-amber-950',
    icon: Clock3,
  },
  approved: {
    title: 'Acceso aprobado',
    description: 'Ya puedes entrar a la agenda del curso. Te llevamos ahora mismo.',
    tone: 'border-emerald-200 bg-emerald-50 text-emerald-950',
    icon: Check,
  },
  denied: {
    title: 'Solicitud no aprobada',
    description: 'Si crees que es un error, contacta con la persona administradora de tu clase.',
    tone: 'border-rose-200 bg-rose-50 text-rose-950',
    icon: X,
  },
  unavailable: {
    title: 'No podemos comprobar tu solicitud',
    description: 'Ahora mismo no se puede consultar el estado. Tu solicitud no se ha perdido: vuelve a intentarlo en unos minutos.',
    tone: 'border-amber-200 bg-amber-50 text-amber-950',
    icon: TriangleAlert,
  },
};

export default function StatusViewPanel({
  email,
  initialStatus,
  initialNotified,
}: {
  email: string;
  initialStatus: StatusView;
  initialNotified: boolean;
}) {
  const [status, setStatus] = useState<StatusView>(initialStatus);
  const [notified, setNotified] = useState(initialNotified);
  const [errorMessage, setErrorMessage] = useState('');
  const [checking, setChecking] = useState(false);
  const redirecting = useRef(false);

  const copy = COPY[status];
  const Icon = copy.icon;

  const checkStatus = useCallback(async () => {
    setChecking(true);
    try {
      const response = await fetch('/api/access/status', { cache: 'no-store' });
      if (response.status === 401 || response.status === 404) {
        window.location.assign('/acceso?modo=recuperar');
        return;
      }
      const body = (await response.json().catch(() => ({}))) as StatusBody;
      if (!response.ok || !body.status) {
        setErrorMessage(body.message || 'No se pudo comprobar el estado.');
        return;
      }
      setErrorMessage('');
      setNotified(Boolean(body.notified));
      setStatus(body.status);
      if (body.status === 'approved' && !redirecting.current) {
        redirecting.current = true;
        // La respuesta ya renovó la cookie; una navegación completa evita páginas en caché.
        window.location.assign('/');
      }
    } catch {
      setErrorMessage('No se pudo comprobar el estado. Revisa tu conexión.');
    } finally {
      setChecking(false);
    }
  }, []);

  // Mientras está pendiente se consulta cada 6 s (solo con la pestaña visible) y al volver a ella.
  // Si la página llega ya aprobada, una consulta renueva la cookie y entra a la agenda.
  useEffect(() => {
    if (status !== 'pending' && status !== 'approved') return;
    const tick = () => {
      if (document.visibilityState === 'visible') void checkStatus();
    };
    tick();
    if (status !== 'pending') return;
    const timer = window.setInterval(tick, 6000);
    document.addEventListener('visibilitychange', tick);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [status, checkStatus]);

  const signOut = async () => {
    try {
      await fetch('/api/access/signout', { method: 'POST' });
    } finally {
      window.location.assign('/acceso');
    }
  };

  return (
    <>
      <div className={`rounded-2xl border p-5 ${copy.tone}`} role="status" aria-live="polite">
        <div className="flex items-center gap-2.5 text-lg font-extrabold">
          <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
          {copy.title}
        </div>
        <p className="mt-2 text-sm leading-6 opacity-90">{copy.description}</p>
        {email && (
          <p className="mt-3 inline-flex items-center gap-2 break-all text-sm font-bold">
            <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />
            {email}
          </p>
        )}
      </div>

      {status === 'pending' && (
        <>
          <button type="button" onClick={() => void checkStatus()} disabled={checking} className={`${secondaryButtonClass} mt-5 w-full`}>
            {checking ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <RefreshCw className="h-4 w-4" aria-hidden="true" />}
            {checking ? 'Comprobando…' : 'Comprobar ahora'}
          </button>
          <p className="mt-2 text-center text-xs text-slate-500">También lo comprobamos solos cada pocos segundos.</p>
          {!notified && (
            <p className="mt-4 rounded-xl bg-slate-50 px-3.5 py-3 text-sm leading-5 text-slate-600">
              Si pasan unos días sin respuesta, avisa a la persona administradora de tu clase. Tu solicitud está guardada.
            </p>
          )}
        </>
      )}

      {status === 'approved' && (
        <button
          type="button"
          onClick={() => window.location.assign('/')}
          className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-xl bg-brand px-4 text-sm font-extrabold text-white hover:bg-brand-dark"
        >
          Entrar a la agenda
        </button>
      )}

      {errorMessage && (
        <p role="alert" className="mt-4 rounded-xl border border-rose-100 bg-rose-50 px-3.5 py-3 text-sm font-semibold text-rose-800">
          {errorMessage}
        </p>
      )}

      <button type="button" onClick={signOut} className="mt-6 inline-flex w-full items-center justify-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-800">
        <LogOut className="h-4 w-4" aria-hidden="true" />
        Cerrar sesión de este navegador
      </button>
    </>
  );
}
