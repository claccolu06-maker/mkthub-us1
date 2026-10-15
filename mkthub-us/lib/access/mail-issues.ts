/** Clasificación del fallo de correo. No contiene secretos: es seguro mostrarla en el panel de administración. */
export type MailIssue = 'configuration' | 'authentication' | 'connection' | 'timeout' | 'unknown';

export interface MailResult {
  ok: boolean;
  issue?: MailIssue;
  /** Código técnico de Nodemailer (EAUTH, ETIMEDOUT…). */
  code?: string;
  /** Nombres (nunca valores) de las variables de entorno que faltan. */
  missing?: string[];
}

export const MAIL_ISSUE_HINTS: Record<MailIssue, string> = {
  configuration:
    'Faltan variables de correo en este entorno de Vercel. Añádelas en Settings → Environment Variables (ámbito Preview) y vuelve a desplegar.',
  authentication:
    'El servidor de correo rechazó el usuario o la contraseña. Con Gmail hace falta una «contraseña de aplicación» (no la contraseña normal) y la verificación en dos pasos activada.',
  connection:
    'No se pudo conectar con el servidor de correo. Revisa SMTP_HOST y SMTP_PORT (Gmail: smtp.gmail.com y 465).',
  timeout:
    'El servidor de correo tardó demasiado en responder. Inténtalo de nuevo; si se repite, el entorno puede estar bloqueando el puerto SMTP y conviene usar un proveedor de correo por API (HTTPS).',
  unknown:
    'El envío falló por una causa no identificada. Los detalles técnicos están en los Runtime Logs de Vercel (busca «Mail delivery failed»).',
};
