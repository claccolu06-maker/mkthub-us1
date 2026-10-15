import type { RequestStatus } from '@/lib/access/session';

/** Fila de public.access_requests. `user_id` es el identificador de la solicitud. */
export interface AccessRequestRow {
  user_id: string;
  email: string;
  username: string | null;
  full_name: string | null;
  course: string | null;
  shift: string | null;
  reason: string | null;
  status: RequestStatus;
  requested_at: string;
  reviewed_at: string | null;
  /** Cuándo se consiguió avisar a administración por correo. null = todavía sin avisar. */
  admin_notified_at: string | null;
}
