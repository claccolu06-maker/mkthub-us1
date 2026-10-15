import type { NextRequest } from 'next/server';
import { isApprover } from '@/lib/access/approver';
import { clientIp, jsonNoStore } from '@/lib/access/http';
import { EmailSchema } from '@/lib/access/schemas';
import { rateLimit } from '@/lib/rate-limit';
import { getSiteUrl } from '@/lib/site-url';
import { getSupabasePublicConfig } from '@/lib/supabase/config';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * Enlace de acceso al panel, SOLO para el correo de administración (ACCESS_APPROVER_EMAIL).
 * Lo envía Supabase Auth, así que funciona aunque el SMTP de la app no esté configurado todavía.
 * El alumnado no usa este flujo.
 */
export async function POST(request: NextRequest) {
  if (!rateLimit(`admin-login:${clientIp(request)}`, 5, 10 * 60 * 1000)) {
    return jsonNoStore({ message: 'Demasiados intentos. Espera unos minutos.' }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonNoStore({ message: 'Escribe el correo de administración.' }, { status: 400 });
  }

  const parsed = EmailSchema.safeParse((body as { email?: unknown } | null)?.email);
  if (!parsed.success) return jsonNoStore({ message: 'Escribe un correo válido.' }, { status: 400 });
  if (!isApprover(parsed.data)) {
    return jsonNoStore({ message: 'Ese correo no tiene acceso al panel de administración.' }, { status: 403 });
  }
  if (!getSupabasePublicConfig()) {
    return jsonNoStore({ message: 'Falta configurar Supabase para el acceso de administración.' }, { status: 503 });
  }

  try {
    // El cliente "server" guarda en una cookie el código de verificación (PKCE) que luego usa /auth/callback.
    // Por eso el enlace del correo debe abrirse en este mismo navegador.
    const supabase = createSupabaseServerClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: parsed.data,
      options: {
        emailRedirectTo: new URL('/auth/callback', getSiteUrl(request)).toString(),
        shouldCreateUser: true,
      },
    });
    if (error) throw error;
    return jsonNoStore({ sent: true });
  } catch (error) {
    console.error('Could not send the admin sign-in link:', error);
    return jsonNoStore({ message: 'No se pudo enviar el enlace. Comprueba la configuración de Supabase Auth.' }, { status: 503 });
  }
}
