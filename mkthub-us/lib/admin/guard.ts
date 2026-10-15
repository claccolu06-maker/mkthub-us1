import 'server-only';

import { isApprover } from '@/lib/access/approver';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export interface AdminUser {
  id: string;
  email: string;
}

/** Devuelve a la persona administradora con sesión iniciada, o null si no la hay (o no es quien debe). */
export async function getAdminUser(): Promise<AdminUser | null> {
  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user?.email || !isApprover(data.user.email)) return null;
    return { id: data.user.id, email: data.user.email };
  } catch {
    return null;
  }
}
