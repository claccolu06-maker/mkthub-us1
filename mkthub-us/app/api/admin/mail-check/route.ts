import { getApproverEmail } from '@/lib/access/approver';
import { buildTestMessage } from '@/lib/access/emails';
import { jsonNoStore } from '@/lib/access/http';
import { MAIL_ISSUE_HINTS } from '@/lib/access/mail-issues';
import { sendMail } from '@/lib/access/mailer';
import { getAdminUser } from '@/lib/admin/guard';

export const dynamic = 'force-dynamic';
// El envío por SMTP puede tardar; se da margen para que la función no se corte a los 10 s.
export const maxDuration = 30;

/**
 * Envía un correo de prueba a la persona administradora y devuelve el diagnóstico.
 * Sirve para saber si el SMTP funciona y, si no, por qué (sin mostrar ningún valor secreto).
 */
export async function POST() {
  const admin = await getAdminUser();
  if (!admin) return jsonNoStore({ message: 'No tienes permiso para hacer esto.' }, { status: 403 });

  const to = getApproverEmail();
  if (!to) {
    return jsonNoStore(
      { sent: false, issue: 'configuration', missing: ['ACCESS_APPROVER_EMAIL'], message: MAIL_ISSUE_HINTS.configuration },
      { status: 502 },
    );
  }

  const result = await sendMail({ to, ...buildTestMessage() });
  if (result.ok) return jsonNoStore({ sent: true, message: 'Correo de prueba enviado. Revisa la bandeja de administración.' });

  return jsonNoStore(
    {
      sent: false,
      issue: result.issue,
      code: result.code,
      missing: result.missing,
      message: result.issue ? MAIL_ISSUE_HINTS[result.issue] : 'No se pudo enviar el correo de prueba.',
    },
    { status: 502 },
  );
}
