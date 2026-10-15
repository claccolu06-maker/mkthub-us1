import 'server-only';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getSupabasePublicConfig } from '@/lib/supabase/config';

/**
 * Cliente de Supabase Auth ligado a las cookies de la petición.
 * Solo lo usa el acceso de la persona administradora; el alumnado no usa Supabase Auth.
 */
export function createSupabaseServerClient() {
  const config = getSupabasePublicConfig();
  if (!config) throw new Error('Falta configurar Supabase (URL y clave pública).');

  const cookieStore = cookies();
  return createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Un componente de servidor no puede escribir cookies; el middleware renueva la sesión.
        }
      },
    },
  });
}
