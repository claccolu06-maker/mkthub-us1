'use client';

import { useState, type FormEvent } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { Field, inputClass, primaryButtonClass } from '@/components/access/field';
import { EmailSchema } from '@/lib/access/schemas';

const ERRORS: Record<string, string> = {
  verification: 'El enlace no es válido o ha caducado. Pide uno nuevo y ábrelo en este mismo navegador.',
  forbidden: 'Ese correo no tiene acceso al panel de administración.',
  configuration: 'Falta configurar Supabase para el acceso de administración.',
};

export default function AdminLoginForm({ configured, errorCode }: { configured: boolean; errorCode?: string }) {
  const [email, setEmail] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [message, setMessage] = useState((errorCode && ERRORS[errorCode]) || '');
  const [sentTo, setSentTo] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (sending) return;
    setFieldError('');
    setMessage('');

    const parsed = EmailSchema.safeParse(email);
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message || 'Escribe un correo válido.');
      return;
    }

    setSending(true);
    try {
      const response = await fetch('/api/admin/login-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: parsed.data }),
      });
      const body = (await response.json().catch(() => ({}))) as { message?: string };
      if (!response.ok) {
        setMessage(body.message || 'No se pudo enviar el enlace.');
        return;
      }
      setSentTo(parsed.data);
    } catch {
      setMessage('No se pudo conectar. Inténtalo de nuevo.');
    } finally {
      setSending(false);
    }
  };

  if (!configured) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5" role="status">
        <h1 className="text-lg font-extrabold text-amber-950">Administración sin configurar</h1>
        <p className="mt-2 text-sm leading-6 text-amber-900/90">
          Faltan NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en este entorno de Vercel.
        </p>
      </div>
    );
  }

  if (sentTo) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5" role="status">
        <div className="flex items-center gap-2 text-lg font-extrabold text-emerald-950">
          <Check className="h-5 w-5" aria-hidden="true" />
          Revisa tu correo
        </div>
        <p className="mt-2 text-sm leading-6 text-emerald-900/90">
          Hemos enviado un enlace de acceso a <strong className="break-all">{sentTo}</strong>. Ábrelo en este mismo navegador.
        </p>
      </div>
    );
  }

  return (
    <>
      <h1 className="text-2xl font-extrabold tracking-tight text-ink">Administración</h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Escribe el correo de administración y te enviaremos un enlace seguro para entrar al panel de solicitudes.
      </p>
      <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
        <Field id="admin-email" label="Correo de administración" error={fieldError}>
          <input
            id="admin-email"
            type="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setFieldError('');
            }}
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            required
            aria-invalid={Boolean(fieldError)}
            aria-describedby={fieldError ? 'admin-email-message' : undefined}
            className={inputClass}
          />
        </Field>
        {message && (
          <p role="alert" className="rounded-xl border border-rose-100 bg-rose-50 px-3.5 py-3 text-sm font-semibold text-rose-800">
            {message}
          </p>
        )}
        <button type="submit" disabled={sending} className={primaryButtonClass}>
          {sending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {sending ? 'Enviando…' : 'Enviar enlace de acceso'}
        </button>
      </form>
    </>
  );
}
