import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { isApprover } from '@/lib/access/approver';
import { readSession, SESSION_COOKIE } from '@/lib/access/session';
import { getSupabasePublicConfig } from '@/lib/supabase/config';

/**
 * Primera barrera (rápida, sin base de datos):
 *  - Alumnado: la cookie firmada decide a dónde va (formulario, espera o agenda).
 *    La página de la agenda vuelve a comprobar el estado real en la base de datos.
 *  - Administración: sesión de Supabase Auth con el correo de ACCESS_APPROVER_EMAIL.
 *    Las pantallas de entrada y de revisión por enlace del correo quedan abiertas.
 */

const OPEN_ADMIN_PATHS = new Set(['/admin/entrar', '/admin/revision']);

function redirectTo(request: NextRequest, path: string, carryCookiesFrom?: NextResponse): NextResponse {
  const redirect = NextResponse.redirect(new URL(path, request.url));
  carryCookiesFrom?.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}

async function guardAdmin(request: NextRequest): Promise<NextResponse> {
  const config = getSupabasePublicConfig();
  if (!config) return redirectTo(request, '/admin/entrar?error=configuration');

  let response = NextResponse.next({ request });
  try {
    const supabase = createServerClient(config.url, config.anonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    });
    // getUser() valida la sesión con Supabase y renueva sus cookies si hace falta.
    const { data } = await supabase.auth.getUser();
    if (data.user?.email && isApprover(data.user.email)) return response;
  } catch (error) {
    console.error('Could not verify the admin session:', error);
  }
  return redirectTo(request, '/admin/entrar', response);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/admin')) {
    return OPEN_ADMIN_PATHS.has(pathname) ? NextResponse.next() : guardAdmin(request);
  }
  if (pathname === '/acceso') return NextResponse.next();

  const session = await readSession(request.cookies.get(SESSION_COOKIE)?.value);
  if (!session) return redirectTo(request, pathname === '/solicitar-acceso' ? '/acceso?modo=recuperar' : '/acceso');
  if (pathname === '/solicitar-acceso') return NextResponse.next();
  if (session.status === 'approved') return NextResponse.next();
  return redirectTo(request, '/solicitar-acceso');
}

export const config = {
  matcher: ['/((?!api/|_next/|auth/|icon.svg|favicon.ico|robots.txt).*)'],
};
