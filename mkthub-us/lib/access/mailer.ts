import 'server-only';

import nodemailer from 'nodemailer';
import type { MailIssue, MailResult } from '@/lib/access/mail-issues';

interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  from: string;
}

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
}

const REQUIRED_VARIABLES = [
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASSWORD',
  'SMTP_FROM_EMAIL',
  'ACCESS_APPROVER_EMAIL',
] as const;

/** Vercel conserva las comillas si se pegan con ellas en el valor de la variable. */
function readVariable(name: string): string {
  const value = process.env[name]?.trim() ?? '';
  return value.replace(/^(["'])(.*)\1$/, '$2').trim();
}

/** Nombres (nunca valores) de las variables de correo que faltan o no son válidas. */
export function getMissingMailVariables(): string[] {
  const missing: string[] = REQUIRED_VARIABLES.filter((name) => !readVariable(name));
  const rawPort = readVariable('SMTP_PORT');
  const port = Number(rawPort);
  if (rawPort && (!Number.isInteger(port) || port <= 0) && !missing.includes('SMTP_PORT')) missing.push('SMTP_PORT');
  return missing;
}

function getSmtpConfig(): SmtpConfig | null {
  if (getMissingMailVariables().length > 0) return null;

  const host = readVariable('SMTP_HOST');
  // Google muestra las contraseñas de aplicación con espacios; funcionan igual sin ellos.
  const rawPassword = readVariable('SMTP_PASSWORD');
  const password = /gmail|googlemail/i.test(host) ? rawPassword.replace(/\s+/g, '') : rawPassword;

  return {
    host,
    port: Number(readVariable('SMTP_PORT')),
    user: readVariable('SMTP_USER'),
    password,
    from: readVariable('SMTP_FROM_EMAIL'),
  };
}

const CONNECTION_CODES = new Set([
  'ECONNECTION',
  'ESOCKET',
  'ECONNREFUSED',
  'ECONNRESET',
  'ENOTFOUND',
  'EDNS',
  'EHOSTUNREACH',
  'ENETUNREACH',
]);

export function classifyMailError(error: unknown): { issue: MailIssue; code?: string } {
  const details = (typeof error === 'object' && error !== null ? error : {}) as { code?: unknown; responseCode?: unknown };
  const code = typeof details.code === 'string' ? details.code : undefined;
  const responseCode = typeof details.responseCode === 'number' ? details.responseCode : undefined;

  if (code === 'EAUTH' || responseCode === 535 || responseCode === 534) return { issue: 'authentication', code };
  if (code === 'ETIMEDOUT' || code === 'ESOCKETTIMEDOUT') return { issue: 'timeout', code };
  if (code && CONNECTION_CODES.has(code)) return { issue: 'connection', code };
  return { issue: 'unknown', code };
}

/**
 * Envía un correo por SMTP. Nunca lanza: devuelve el resultado clasificado para que quien llama
 * pueda guardar la solicitud igualmente y mostrar a administración qué falló (sin secretos).
 * Los tiempos de espera son cortos para no agotar el límite de una función de Vercel.
 */
export async function sendMail(message: MailMessage): Promise<MailResult> {
  const missing = getMissingMailVariables();
  const config = missing.length === 0 ? getSmtpConfig() : null;
  if (!config) return { ok: false, issue: 'configuration', missing };

  try {
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.port === 465,
      requireTLS: config.port !== 465,
      auth: { user: config.user, pass: config.password },
      connectionTimeout: 6_000,
      greetingTimeout: 6_000,
      socketTimeout: 8_000,
    });
    await transporter.sendMail({ from: config.from, ...message });
    return { ok: true };
  } catch (error) {
    const classified = classifyMailError(error);
    console.error('Mail delivery failed:', {
      issue: classified.issue,
      code: classified.code,
      message: error instanceof Error ? error.message : String(error),
    });
    return { ok: false, ...classified };
  }
}
