import 'server-only';

import { buildAdminNotice } from '@/lib/access/emails';
import type { MailResult } from '@/lib/access/mail-issues';
import { getApproverEmail } from '@/lib/access/approver';
import { getMissingMailVariables, sendMail } from '@/lib/access/mailer';
import { markAdminNotified, type AccessRequestRow } from '@/lib/access/requests';
import { createReviewToken } from '@/lib/access/review-token';
import { getSigningSecret } from '@/lib/access/tokens';

/**
 * Avisa a administración de una solicitud con los botones Aprobar / Denegar.
 * Es seguro repetirlo: genera enlaces nuevos y no modifica la solicitud (solo anota cuándo se avisó).
 * Nunca lanza; devuelve el resultado para decidir qué mostrar.
 */
export async function notifyAdminOfRequest(row: AccessRequestRow, siteUrl: string): Promise<MailResult> {
  const missing = getMissingMailVariables();
  if (missing.length > 0) return { ok: false, issue: 'configuration', missing };

  const to = getApproverEmail();
  if (!to) return { ok: false, issue: 'configuration', missing: ['ACCESS_APPROVER_EMAIL'] };
  if (!getSigningSecret()) {
    return { ok: false, issue: 'configuration', missing: ['SUPABASE_SERVICE_ROLE_KEY'] };
  }

  const token = await createReviewToken({
    requestId: row.user_id,
    email: row.email.toLowerCase(),
    requestedAt: row.requested_at,
  });

  const reviewUrl = (decision: 'approved' | 'denied') => {
    const url = new URL('/admin/revision', siteUrl);
    url.searchParams.set('token', token);
    url.searchParams.set('decision', decision);
    return url.toString();
  };

  const message = buildAdminNotice(row, {
    approveUrl: reviewUrl('approved'),
    denyUrl: reviewUrl('denied'),
    panelUrl: new URL('/admin/accesos', siteUrl).toString(),
  });

  const result = await sendMail({ to, ...message });
  if (result.ok) {
    try {
      await markAdminNotified(row.user_id);
    } catch (error) {
      // El correo ya salió; que falle la anotación no debe presentarse como fallo de envío.
      console.error('Could not record the admin notification:', error);
    }
  }
  return result;
}
