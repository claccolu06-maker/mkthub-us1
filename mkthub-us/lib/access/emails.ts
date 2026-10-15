import { COURSE_LABELS, SHIFT_LABELS } from '@/lib/access/schemas';

export interface NoticeRequest {
  email: string;
  username: string | null;
  full_name: string | null;
  course: string | null;
  shift: string | null;
  reason: string | null;
}

export interface NoticeLinks {
  approveUrl: string;
  denyUrl: string;
  panelUrl: string;
}

interface EmailContent {
  subject: string;
  text: string;
  html: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const EMPTY = 'No indicado';

/** Aviso a administración con los botones Aprobar / Denegar. Todo lo que escribe el alumnado va escapado. */
export function buildAdminNotice(request: NoticeRequest, links: NoticeLinks): EmailContent {
  const username = request.username?.trim() || EMPTY;
  const fullName = request.full_name?.trim() || EMPTY;
  const course = request.course ? COURSE_LABELS[request.course] ?? request.course : EMPTY;
  const shift = request.shift ? SHIFT_LABELS[request.shift] ?? request.shift : EMPTY;
  const reason = request.reason?.trim() || 'No se aportó una presentación.';

  const text = [
    'Nueva solicitud de acceso a MktHub US.',
    '',
    `Usuario: @${username}`,
    `Nombre: ${fullName}`,
    `Correo: ${request.email}`,
    `Curso: ${course}`,
    `Turno: ${shift}`,
    '',
    'Presentación:',
    reason,
    '',
    'Aprobar (se abrirá una pantalla de confirmación):',
    links.approveUrl,
    '',
    'Denegar (se abrirá una pantalla de confirmación):',
    links.denyUrl,
    '',
    'Los enlaces son privados, valen 7 días y no piden iniciar sesión.',
    `También puedes revisar las solicitudes en el panel: ${links.panelUrl}`,
  ].join('\n');

  const row = (label: string, value: string) =>
    `<tr><td style="padding:4px 14px 4px 0;color:#64748b;font-size:14px;white-space:nowrap;vertical-align:top">${label}</td><td style="padding:4px 0;font-size:14px;font-weight:600;color:#1b2a49">${escapeHtml(value)}</td></tr>`;

  const html = `<!doctype html>
<html lang="es">
  <body style="margin:0;background:#eef3fb;padding:28px 12px;font-family:Arial,Helvetica,sans-serif;color:#1b2a49">
    <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #dfe8f7">
      <div style="background:#e7efff;padding:22px 26px;border-bottom:1px solid #dfe8f7">
        <div style="font-size:19px;font-weight:700;color:#1b2a49">MktHub <span style="color:#3158db">US</span></div>
        <div style="margin-top:4px;font-size:14px;color:#475569">Nueva solicitud de acceso</div>
      </div>
      <div style="padding:24px 26px">
        <h1 style="margin:0 0 14px;font-size:20px">Revisa esta solicitud</h1>
        <table role="presentation" style="border-collapse:collapse">
          ${row('Usuario', `@${username}`)}
          ${row('Nombre', fullName)}
          ${row('Correo', request.email)}
          ${row('Curso', course)}
          ${row('Turno', shift)}
        </table>
        <div style="margin-top:16px;padding:14px;background:#f4f7fd;border-radius:12px;font-size:14px;line-height:1.6">
          <strong>Presentación</strong><br>${escapeHtml(reason).replace(/\r?\n/g, '<br>')}
        </div>
        <p style="margin:24px 0 12px;font-size:14px;font-weight:700">Elige una opción:</p>
        <div>
          <a href="${escapeHtml(links.approveUrl)}" style="display:inline-block;background:#3158db;color:#ffffff;text-decoration:none;border-radius:10px;padding:12px 22px;font-size:15px;font-weight:700">Aprobar</a>
          <a href="${escapeHtml(links.denyUrl)}" style="display:inline-block;margin-left:8px;background:#ffffff;color:#a12b32;text-decoration:none;border:1px solid #f1c8cb;border-radius:10px;padding:11px 22px;font-size:15px;font-weight:700">Denegar</a>
        </div>
        <p style="margin:16px 0 0;font-size:13px;line-height:1.6;color:#64748b">Al pulsar se abre una pantalla de confirmación: nada se decide solo por abrir o previsualizar el correo. Los enlaces son privados, valen 7 días y no piden iniciar sesión.</p>
        <p style="margin:16px 0 0;font-size:13px"><a href="${escapeHtml(links.panelUrl)}" style="color:#3158db">Abrir el panel de solicitudes</a></p>
      </div>
    </div>
  </body>
</html>`;

  return { subject: 'Acción requerida: solicitud de acceso a MktHub US', text, html };
}

/** Mensaje de prueba para comprobar la configuración de correo desde el panel. */
export function buildTestMessage(): EmailContent {
  return {
    subject: 'Prueba de correo de MktHub US',
    text: 'Este es un mensaje de prueba. Si lo lees, el correo de MktHub US está bien configurado.',
    html: '<!doctype html><html lang="es"><body style="font-family:Arial,Helvetica,sans-serif;color:#1b2a49;padding:24px"><h1 style="font-size:18px">Prueba de correo de MktHub US</h1><p>Si lees esto, el correo de MktHub US está bien configurado.</p></body></html>',
  };
}
