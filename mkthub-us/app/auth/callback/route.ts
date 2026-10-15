import { NextResponse } from 'next/server';
import { isApprover } from '@/lib/access/approver';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/** Destino del enlace de acceso de administración. Solo el correo de administración llega al panel. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  if (!code) return NextResponse.redirect(new URL('/admin/entrar?error=verification', url.origin));

  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error || !data.user?.email) return NextResponse.redirect(new URL('/admin/entrar?error=verification', url.origin));

    if (isApprover(data.user.email)) return NextResponse.redirect(new URL('/admin/accesos', url.origin));

    await supabase.auth.signOut();
    return NextResponse.redirect(new URL('/admin/entrar?error=forbidden', url.origin));
  } catch (error) {
    console.error('Supabase callback failed:', error);
    return NextResponse.redirect(new URL('/admin/entrar?error=configuration', url.origin));
  }
}
