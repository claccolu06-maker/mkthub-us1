'use client';

import { useState, type FormEvent } from 'react';
import { Loader2 } from 'lucide-react';
import { Field, inputClass, primaryButtonClass } from '@/components/access/field';
import {
  ClaimSchema,
  COURSE_OPTIONS,
  RegistrationFormSchema,
  SHIFT_OPTIONS,
  type RegistrationField,
} from '@/lib/access/schemas';

export type AccessMode = 'register' | 'recover';

type FieldErrors = Partial<Record<RegistrationField, string>>;
type ApiFieldErrors = Record<string, string[] | undefined>;

interface ApiBody {
  status?: 'pending' | 'approved' | 'denied';
  message?: string;
  recover?: boolean;
  fieldErrors?: ApiFieldErrors;
}

const FIELDS: RegistrationField[] = ['email', 'username', 'fullName', 'course', 'shift', 'reason'];

function firstErrors(source: ApiFieldErrors | undefined): FieldErrors {
  const result: FieldErrors = {};
  for (const field of FIELDS) {
    const message = source?.[field]?.[0];
    if (message) result[field] = message;
  }
  return result;
}

const COPY: Record<AccessMode, { title: string; description: string; submit: string }> = {
  register: {
    title: 'Solicita acceso',
    description:
      'Rellena tus datos una sola vez. La persona administradora revisará tu solicitud y, cuando la apruebe, entrarás desde este mismo navegador. No necesitas contraseña.',
    submit: 'Enviar solicitud',
  },
  recover: {
    title: 'Recupera tu solicitud',
    description:
      'Escribe el mismo correo y nombre de usuario que usaste al solicitar acceso. No tendrás que rellenar el formulario otra vez.',
    submit: 'Recuperar mi solicitud',
  },
};

export default function AccessForm({ initialMode, notice = '' }: { initialMode: AccessMode; notice?: string }) {
  const [mode, setMode] = useState<AccessMode>(initialMode);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [course, setCourse] = useState<string>(COURSE_OPTIONS[0].value);
  const [shift, setShift] = useState('');
  const [reason, setReason] = useState('');
  const [website, setWebsite] = useState(''); // campo trampa: debe quedar vacío
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState(notice);
  const [sending, setSending] = useState(false);

  const copy = COPY[mode];

  const clearError = (field: RegistrationField) => setErrors((current) => ({ ...current, [field]: undefined }));
  const describe = (field: RegistrationField) => (errors[field] ? `field-${field}-message` : undefined);

  const switchMode = (next: AccessMode) => {
    if (next === mode) return;
    setMode(next);
    setErrors({});
    setServerError('');
  };

  async function send(url: string, payload: unknown) {
    setSending(true);
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const body = (await response.json().catch(() => ({}))) as ApiBody;

      if (!response.ok || !body.status) {
        const fieldErrors = firstErrors(body.fieldErrors);
        if (Object.keys(fieldErrors).length > 0) setErrors(fieldErrors);
        else setServerError(body.message || 'No se pudo completar la solicitud. Inténtalo de nuevo.');
        if (body.recover) setMode('recover');
        setSending(false);
        return;
      }
      if (body.status === 'denied') {
        setServerError(body.message || 'La solicitud anterior no fue aprobada. Contacta con administración.');
        setSending(false);
        return;
      }

      // Navegación completa: garantiza que el navegador envía ya la cookie recién creada.
      window.location.assign(body.status === 'approved' ? '/' : '/solicitar-acceso');
    } catch {
      setServerError('No se pudo conectar. Comprueba tu conexión e inténtalo de nuevo.');
      setSending(false);
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (sending) return;
    setErrors({});
    setServerError('');

    if (mode === 'recover') {
      const parsed = ClaimSchema.safeParse({ email, username });
      if (!parsed.success) {
        setErrors(firstErrors(parsed.error.flatten().fieldErrors as ApiFieldErrors));
        return;
      }
      await send('/api/access/claim', parsed.data);
      return;
    }

    const parsed = RegistrationFormSchema.safeParse({ email, username, fullName, course, shift, reason });
    if (!parsed.success) {
      setErrors(firstErrors(parsed.error.flatten().fieldErrors as ApiFieldErrors));
      return;
    }
    await send('/api/access/request', { ...parsed.data, website });
  };

  const tabClass = (active: boolean) =>
    `flex-1 rounded-lg px-3 py-2 text-sm font-bold transition ${active ? 'bg-white text-brand shadow-sm ring-1 ring-blue-100' : 'text-slate-500 hover:text-slate-800'}`;

  return (
    <>
      <div className="flex gap-1 rounded-xl border border-blue-100/80 bg-[#e6ecf8] p-1" role="tablist" aria-label="Qué quieres hacer">
        <button type="button" role="tab" aria-selected={mode === 'register'} onClick={() => switchMode('register')} className={tabClass(mode === 'register')}>
          Solicitar acceso
        </button>
        <button type="button" role="tab" aria-selected={mode === 'recover'} onClick={() => switchMode('recover')} className={tabClass(mode === 'recover')}>
          Ya envié mi solicitud
        </button>
      </div>

      <div className="mt-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">{copy.title}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">{copy.description}</p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="relative mt-6 space-y-4">
        <Field id="field-email" label="Correo electrónico" error={errors.email}>
          <input
            id="field-email"
            type="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              clearError('email');
            }}
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            required
            maxLength={254}
            placeholder="tu.correo@ejemplo.com"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={describe('email')}
            className={inputClass}
          />
        </Field>

        <Field
          id="field-username"
          label={mode === 'recover' ? 'Nombre de usuario de la solicitud' : 'Nombre de usuario'}
          error={errors.username}
          hint="Con o sin @, con tildes o espacios. Entre 2 y 40 caracteres."
        >
          <input
            id="field-username"
            value={username}
            onChange={(event) => {
              setUsername(event.target.value);
              clearError('username');
            }}
            autoComplete="username"
            required
            maxLength={60}
            placeholder="por ejemplo, laura_mkt"
            aria-invalid={Boolean(errors.username)}
            aria-describedby="field-username-message"
            className={inputClass}
          />
        </Field>

        {mode === 'register' && (
          <>
            <Field id="field-fullName" label="Nombre y apellidos" error={errors.fullName}>
              <input
                id="field-fullName"
                value={fullName}
                onChange={(event) => {
                  setFullName(event.target.value);
                  clearError('fullName');
                }}
                autoComplete="name"
                required
                maxLength={120}
                placeholder="Tu nombre completo"
                aria-invalid={Boolean(errors.fullName)}
                aria-describedby={describe('fullName')}
                className={inputClass}
              />
            </Field>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field id="field-course" label="Curso" error={errors.course}>
                <select
                  id="field-course"
                  value={course}
                  onChange={(event) => {
                    setCourse(event.target.value);
                    clearError('course');
                  }}
                  required
                  aria-invalid={Boolean(errors.course)}
                  aria-describedby={describe('course')}
                  className={inputClass}
                >
                  {COURSE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field id="field-shift" label="Turno" error={errors.shift}>
                <select
                  id="field-shift"
                  value={shift}
                  onChange={(event) => {
                    setShift(event.target.value);
                    clearError('shift');
                  }}
                  required
                  aria-invalid={Boolean(errors.shift)}
                  aria-describedby={describe('shift')}
                  className={inputClass}
                >
                  <option value="" disabled>
                    Elige el turno
                  </option>
                  {SHIFT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <Field id="field-reason" label="Cuéntanos quién eres" error={errors.reason}>
              <textarea
                id="field-reason"
                value={reason}
                onChange={(event) => {
                  setReason(event.target.value);
                  clearError('reason');
                }}
                required
                maxLength={500}
                rows={4}
                placeholder="Por ejemplo: soy de 3º de Marketing, del turno de mañana, y quiero compartir fechas con la clase."
                aria-invalid={Boolean(errors.reason)}
                aria-describedby={describe('reason')}
                className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-brand focus:ring-4 focus:ring-blue-100 aria-[invalid=true]:border-rose-400"
              />
              <p className="mt-1 text-right text-xs text-slate-500">{reason.length}/500</p>
            </Field>

            {/* Campo trampa para bots: fuera de pantalla y fuera del orden de tabulación. */}
            <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
              <label>
                No rellenar
                <input type="text" name="website" tabIndex={-1} autoComplete="off" value={website} onChange={(event) => setWebsite(event.target.value)} />
              </label>
            </div>
          </>
        )}

        {serverError && (
          <p role="alert" className="rounded-xl border border-rose-100 bg-rose-50 px-3.5 py-3 text-sm font-semibold leading-5 text-rose-800">
            {serverError}
          </p>
        )}

        <button type="submit" disabled={sending} className={primaryButtonClass}>
          {sending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {sending ? 'Un momento…' : copy.submit}
        </button>
      </form>

      <p className="mt-6 border-t border-slate-100 pt-4 text-xs leading-5 text-slate-500">
        La solicitud se revisa a mano. No pedimos contraseña ni enviamos enlaces de acceso al alumnado.
      </p>
    </>
  );
}
