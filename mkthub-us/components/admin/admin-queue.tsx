'use client';

import { useMemo, useState } from 'react';
import { BellRing, Check, Clock3, Loader2, LogOut, MailCheck, ShieldCheck, TriangleAlert, X } from 'lucide-react';
import { BrandMark } from '@/components/access/shell';
import { secondaryButtonClass } from '@/components/access/field';
import { formatDateTime } from '@/lib/academic';
import { COURSE_LABELS, SHIFT_LABELS } from '@/lib/access/schemas';
import type { RequestStatus } from '@/lib/access/session';
import type { AccessRequestRow } from '@/lib/access/types';

type Notice = { tone: 'info' | 'error'; text: string };

interface MailCheckResult {
  sent: boolean;
  message: string;
  issue?: string;
  code?: string;
  missing?: string[];
}

const TABS: Array<{ value: RequestStatus; label: string }> = [
  { value: 'pending', label: 'Pendientes' },
  { value: 'approved', label: 'Aprobadas' },
  { value: 'denied', label: 'Denegadas' },
];

const EMPTY_COPY: Record<RequestStatus, string> = {
  pending: 'No hay solicitudes pendientes. Cuando alguien la envíe, aparecerá aquí.',
  approved: 'Todavía no has aprobado a nadie.',
  denied: 'No hay solicitudes denegadas.',
};

function isComplete(row: AccessRequestRow): boolean {
  return Boolean(row.username?.trim() && row.full_name?.trim() && row.course?.trim() && row.shift?.trim() && row.reason?.trim());
}

export default function AdminQueue({
  initialRequests,
  loadError,
  adminEmail,
}: {
  initialRequests: AccessRequestRow[];
  loadError: string;
  adminEmail: string;
}) {
  const [requests, setRequests] = useState(initialRequests);
  const [tab, setTab] = useState<RequestStatus>(initialRequests.some((row) => row.status === 'pending') ? 'pending' : 'approved');
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(loadError ? { tone: 'error', text: loadError } : null);
  const [mailCheck, setMailCheck] = useState<MailCheckResult | null>(null);
  const [checkingMail, setCheckingMail] = useState(false);

  const counts = useMemo(
    () => ({
      pending: requests.filter((row) => row.status === 'pending').length,
      approved: requests.filter((row) => row.status === 'approved').length,
      denied: requests.filter((row) => row.status === 'denied').length,
    }),
    [requests],
  );
  const visible = useMemo(() => requests.filter((row) => row.status === tab), [requests, tab]);

  const patchRow = (id: string, changes: Partial<AccessRequestRow>) =>
    setRequests((current) => current.map((row) => (row.user_id === id ? { ...row, ...changes } : row)));

  async function decide(row: AccessRequestRow, status: 'approved' | 'denied') {
    if (row.status === 'approved' && status === 'denied' && !window.confirm(`¿Revocar el acceso de ${row.full_name || row.email}? Dejará de poder entrar a la agenda.`)) return;

    setWorkingId(row.user_id);
    setNotice(null);
    try {
      const response = await fetch('/api/admin/access', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: row.user_id, status }),
      });
      const body = (await response.json().catch(() => ({}))) as { message?: string; reviewedAt?: string };
      if (!response.ok) {
        setNotice({ tone: 'error', text: body.message || 'No se pudo guardar la decisión.' });
        return;
      }
      patchRow(row.user_id, { status, reviewed_at: body.reviewedAt ?? new Date().toISOString() });
      setNotice({ tone: 'info', text: body.message || 'Decisión guardada.' });
    } catch {
      setNotice({ tone: 'error', text: 'No se pudo conectar con el servidor.' });
    } finally {
      setWorkingId(null);
    }
  }

  async function resendNotice(row: AccessRequestRow) {
    setWorkingId(row.user_id);
    setNotice(null);
    try {
      const response = await fetch('/api/admin/access/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: row.user_id }),
      });
      const body = (await response.json().catch(() => ({}))) as { sent?: boolean; message?: string };
      if (response.ok && body.sent) {
        patchRow(row.user_id, { admin_notified_at: new Date().toISOString() });
        setNotice({ tone: 'info', text: body.message || 'Aviso enviado.' });
      } else {
        setNotice({ tone: 'error', text: body.message || 'No se pudo reenviar el aviso.' });
      }
    } catch {
      setNotice({ tone: 'error', text: 'No se pudo conectar con el servidor.' });
    } finally {
      setWorkingId(null);
    }
  }

  async function runMailCheck() {
    setCheckingMail(true);
    setMailCheck(null);
    try {
      const response = await fetch('/api/admin/mail-check', { method: 'POST' });
      const body = (await response.json().catch(() => ({}))) as Partial<MailCheckResult>;
      setMailCheck({
        sent: Boolean(response.ok && body.sent),
        message: body.message || 'No se pudo hacer la comprobación.',
        issue: body.issue,
        code: body.code,
        missing: body.missing,
      });
    } catch {
      setMailCheck({ sent: false, message: 'No se pudo conectar con el servidor.' });
    } finally {
      setCheckingMail(false);
    }
  }

  async function signOut() {
    try {
      await fetch('/api/admin/signout', { method: 'POST' });
    } finally {
      window.location.assign('/admin/entrar');
    }
  }

  return (
    <main className="mx-auto max-w-[820px] px-4 py-8 sm:px-6 sm:py-12">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <BrandMark />
          <div>
            <p className="text-base font-extrabold leading-tight tracking-tight text-ink">
              MktHub <span className="text-brand">US</span>
            </p>
            <p className="text-xs font-medium text-slate-500">Administración · {adminEmail}</p>
          </div>
        </div>
        <button type="button" onClick={signOut} className={secondaryButtonClass}>
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Cerrar sesión
        </button>
      </header>

      <section className="mt-8 rounded-3xl border border-white/80 bg-white p-5 shadow-soft sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-ink">Solicitudes de acceso</h1>
              <p className="mt-1 text-sm leading-5 text-slate-600">Aprueba o deniega. Quien esté aprobado entra desde el navegador donde envió la solicitud.</p>
            </div>
          </div>
          <button type="button" onClick={runMailCheck} disabled={checkingMail} className={secondaryButtonClass}>
            {checkingMail ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <MailCheck className="h-4 w-4" aria-hidden="true" />}
            Probar el correo
          </button>
        </div>

        {mailCheck && (
          <div role="status" className={`mt-4 rounded-2xl border p-4 text-sm leading-6 ${mailCheck.sent ? 'border-emerald-200 bg-emerald-50 text-emerald-950' : 'border-amber-200 bg-amber-50 text-amber-950'}`}>
            <p className="font-bold">{mailCheck.sent ? 'El correo funciona' : 'El correo no está funcionando'}</p>
            <p className="mt-1">{mailCheck.message}</p>
            {!mailCheck.sent && mailCheck.missing && mailCheck.missing.length > 0 && (
              <p className="mt-2">
                Variables que faltan: <span className="font-mono text-[13px]">{mailCheck.missing.join(', ')}</span>
              </p>
            )}
            {!mailCheck.sent && mailCheck.code && (
              <p className="mt-2 text-xs opacity-80">Código técnico: {mailCheck.code}</p>
            )}
          </div>
        )}

        {notice && (
          <p role="status" className={`mt-4 rounded-xl border px-3.5 py-3 text-sm font-semibold ${notice.tone === 'error' ? 'border-rose-100 bg-rose-50 text-rose-800' : 'border-blue-100 bg-blue-50 text-blue-900'}`}>
            {notice.text}
          </p>
        )}

        <div className="mt-6 flex gap-1 rounded-xl border border-blue-100/80 bg-[#e6ecf8] p-1" role="tablist" aria-label="Estado de las solicitudes">
          {TABS.map((item) => (
            <button
              key={item.value}
              type="button"
              role="tab"
              aria-selected={tab === item.value}
              onClick={() => setTab(item.value)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-2 py-2 text-sm font-bold transition ${tab === item.value ? 'bg-white text-brand shadow-sm ring-1 ring-blue-100' : 'text-slate-500 hover:text-slate-800'}`}
            >
              {item.label}
              <span className={`rounded-md px-1.5 py-0.5 text-xs ${tab === item.value ? 'bg-blue-50 text-brand' : 'bg-white/70 text-slate-500'}`}>{counts[item.value]}</span>
            </button>
          ))}
        </div>

        {visible.length > 0 ? (
          <ul className="mt-5 space-y-3">
            {visible.map((row) => {
              const busy = workingId === row.user_id;
              return (
                <li key={row.user_id} className="rounded-2xl border border-slate-100 bg-[#fbfcff] p-4 sm:p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-extrabold text-ink">{row.username ? `@${row.username}` : 'Usuario sin indicar'}</p>
                      <p className="mt-0.5 text-sm font-semibold text-slate-700">{row.full_name || 'Nombre no indicado'}</p>
                      <p className="mt-0.5 break-all text-sm font-semibold text-brand">{row.email}</p>
                      <p className="mt-2 text-sm text-slate-600">
                        {row.course ? COURSE_LABELS[row.course] ?? row.course : 'Curso sin indicar'} · Turno {row.shift ? (SHIFT_LABELS[row.shift] ?? row.shift).toLowerCase() : 'sin indicar'}
                      </p>
                      <div className="mt-3 rounded-xl bg-white px-3.5 py-3">
                        <p className="text-xs font-bold text-slate-500">Presentación</p>
                        <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{row.reason || 'No se aportó una presentación.'}</p>
                      </div>
                      <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-slate-500">
                        <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                        Solicitada {formatDateTime(row.requested_at)}
                        {row.reviewed_at && row.status !== 'pending' ? ` · Revisada ${formatDateTime(row.reviewed_at)}` : ''}
                      </p>
                      {row.status === 'pending' && !row.admin_notified_at && (
                        <p className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-900">
                          <TriangleAlert className="h-3.5 w-3.5" aria-hidden="true" />
                          El aviso por correo no se pudo enviar
                        </p>
                      )}
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center gap-2 sm:flex-col sm:items-stretch">
                      {row.status !== 'approved' && (
                        <button
                          type="button"
                          disabled={busy || workingId !== null || !isComplete(row)}
                          onClick={() => decide(row, 'approved')}
                          className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-brand px-4 text-sm font-extrabold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Check className="h-4 w-4" aria-hidden="true" />
                          {busy ? 'Guardando…' : isComplete(row) ? 'Aprobar' : 'Faltan datos'}
                        </button>
                      )}
                      {row.status !== 'denied' && (
                        <button
                          type="button"
                          disabled={busy || workingId !== null}
                          onClick={() => decide(row, 'denied')}
                          className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-white px-4 text-sm font-bold text-rose-800 hover:bg-rose-50 disabled:opacity-50"
                        >
                          <X className="h-4 w-4" aria-hidden="true" />
                          {row.status === 'approved' ? 'Revocar acceso' : 'Denegar'}
                        </button>
                      )}
                      {row.status === 'pending' && !row.admin_notified_at && (
                        <button type="button" disabled={busy || workingId !== null} onClick={() => resendNotice(row)} className={secondaryButtonClass}>
                          <BellRing className="h-4 w-4" aria-hidden="true" />
                          Reenviar aviso
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="mt-5 rounded-2xl border border-dashed border-blue-200 bg-brand-soft/40 px-5 py-10 text-center">
            <ShieldCheck className="mx-auto h-6 w-6 text-blue-400" aria-hidden="true" />
            <p className="mx-auto mt-2 max-w-sm text-sm text-slate-600">{EMPTY_COPY[tab]}</p>
          </div>
        )}
      </section>
    </main>
  );
}
