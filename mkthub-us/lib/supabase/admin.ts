import 'server-only';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let cachedClient: SupabaseClient | null = null;

export function hasSupabaseAdminConfig(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() && process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());
}

/**
 * Cliente con la clave service-role: se salta las reglas RLS. Solo para código de servidor
 * (rutas API y páginas del servidor). Nunca debe importarse desde un componente de cliente.
 */
export function createAdminClient(): SupabaseClient {
  if (cachedClient) return cachedClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceRoleKey) throw new Error('Falta configurar Supabase (URL y clave de servicio).');

  cachedClient = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return cachedClient;
}
