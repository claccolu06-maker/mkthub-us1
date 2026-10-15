import { jsonNoStore } from '@/lib/access/http';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    await createSupabaseServerClient().auth.signOut();
  } catch (error) {
    console.error('Admin sign-out failed:', error);
  }
  return jsonNoStore({ ok: true });
}
