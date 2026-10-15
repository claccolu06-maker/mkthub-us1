import 'server-only';

import type { RegistrationProfile } from '@/lib/access/schemas';
import type { AccessSession } from '@/lib/access/session';
import type { ReviewTokenPayload } from '@/lib/access/review-token';
import type { AccessRequestRow } from '@/lib/access/types';
import { createAdminClient } from '@/lib/supabase/admin';

export type { AccessRequestRow } from '@/lib/access/types';

const COLUMNS = 'user_id, email, username, full_name, course, shift, reason, status, requested_at, reviewed_at, admin_notified_at';
const TABLE = 'access_requests';

function fail(action: string, message: string): never {
  throw new Error(`No se pudo ${action}: ${message}`);
}

export async function findRequestByEmail(email: string): Promise<AccessRequestRow | null> {
  const { data, error } = await createAdminClient().from(TABLE).select(COLUMNS).eq('email', email).maybeSingle();
  if (error) fail('consultar la solicitud', error.message);
  return (data as AccessRequestRow | null) ?? null;
}

export async function findRequestById(requestId: string): Promise<AccessRequestRow | null> {
  const { data, error } = await createAdminClient().from(TABLE).select(COLUMNS).eq('user_id', requestId).maybeSingle();
  if (error) fail('consultar la solicitud', error.message);
  return (data as AccessRequestRow | null) ?? null;
}

function sameInstant(first: string, second: string): boolean {
  return Date.parse(first) === Date.parse(second);
}

/** Solicitud a la que está ligada una sesión del navegador (comprueba id, correo y fecha de solicitud). */
export async function findRequestForSession(session: AccessSession): Promise<AccessRequestRow | null> {
  const row = await findRequestById(session.requestId);
  if (!row || row.email.toLowerCase() !== session.email || !sameInstant(row.requested_at, session.requestedAt)) return null;
  return row;
}

/** Crea una solicitud pendiente. Si otra petición la creó a la vez (correo único), devuelve la existente. */
export async function createRequest(
  email: string,
  profile: RegistrationProfile,
): Promise<{ row: AccessRequestRow; created: boolean }> {
  const { data, error } = await createAdminClient()
    .from(TABLE)
    .insert({
      user_id: globalThis.crypto.randomUUID(),
      email,
      username: profile.username,
      full_name: profile.fullName,
      course: profile.course,
      shift: profile.shift,
      reason: profile.reason,
      status: 'pending',
    })
    .select(COLUMNS)
    .single();

  if (error) {
    if (error.code === '23505') {
      const existing = await findRequestByEmail(email);
      if (existing) return { row: existing, created: false };
    }
    fail('guardar la solicitud', error.message);
  }
  return { row: data as AccessRequestRow, created: true };
}

/**
 * Actualiza los datos de una solicitud que sigue pendiente.
 * No toca requested_at: la fecha original de la solicitud se conserva siempre.
 */
export async function updatePendingProfile(requestId: string, profile: RegistrationProfile): Promise<AccessRequestRow | null> {
  const { data, error } = await createAdminClient()
    .from(TABLE)
    .update({
      username: profile.username,
      full_name: profile.fullName,
      course: profile.course,
      shift: profile.shift,
      reason: profile.reason,
    })
    .eq('user_id', requestId)
    .eq('status', 'pending')
    .select(COLUMNS)
    .maybeSingle();
  if (error) fail('actualizar la solicitud', error.message);
  return (data as AccessRequestRow | null) ?? null;
}

export async function markAdminNotified(requestId: string): Promise<void> {
  const { error } = await createAdminClient()
    .from(TABLE)
    .update({ admin_notified_at: new Date().toISOString() })
    .eq('user_id', requestId);
  if (error) fail('registrar el aviso a administración', error.message);
}

/** Decisión tomada desde el panel de administración (admite cambiar una decisión anterior). */
export async function setRequestStatus(
  requestId: string,
  status: 'approved' | 'denied',
  reviewerId: string | null,
): Promise<AccessRequestRow | null> {
  const { data, error } = await createAdminClient()
    .from(TABLE)
    .update({ status, reviewed_at: new Date().toISOString(), reviewed_by: reviewerId })
    .eq('user_id', requestId)
    .select(COLUMNS)
    .maybeSingle();
  if (error) fail('guardar la decisión', error.message);
  return (data as AccessRequestRow | null) ?? null;
}

export type EmailDecisionResult =
  | { result: 'updated' | 'already'; row: AccessRequestRow }
  | { result: 'conflict'; row: AccessRequestRow }
  | { result: 'not_found' };

/**
 * Decisión desde el enlace del correo. Es idempotente: repetir la misma decisión no falla,
 * y solo se decide sobre solicitudes que siguen pendientes.
 */
export async function decideFromEmail(
  payload: ReviewTokenPayload,
  status: 'approved' | 'denied',
): Promise<EmailDecisionResult> {
  const row = await findRequestById(payload.requestId);
  if (!row || row.email.toLowerCase() !== payload.email.toLowerCase() || !sameInstant(row.requested_at, payload.requestedAt)) {
    return { result: 'not_found' };
  }
  if (row.status === status) return { result: 'already', row };
  if (row.status !== 'pending') return { result: 'conflict', row };

  const { data, error } = await createAdminClient()
    .from(TABLE)
    .update({ status, reviewed_at: new Date().toISOString(), reviewed_by: null })
    .eq('user_id', row.user_id)
    .eq('status', 'pending')
    .select(COLUMNS)
    .maybeSingle();
  if (error) fail('guardar la decisión', error.message);
  if (!data) {
    // Otra decisión se guardó justo antes: volvemos a leer el estado real.
    const latest = await findRequestById(row.user_id);
    if (latest?.status === status) return { result: 'already', row: latest };
    return latest ? { result: 'conflict', row: latest } : { result: 'not_found' };
  }
  return { result: 'updated', row: data as AccessRequestRow };
}

/** Todas las solicitudes, las más recientes primero (el panel muestra pendientes, aprobadas y denegadas). */
export async function listRequests(limit = 500): Promise<AccessRequestRow[]> {
  const { data, error } = await createAdminClient()
    .from(TABLE)
    .select(COLUMNS)
    .order('requested_at', { ascending: false })
    .limit(limit);
  if (error) fail('leer las solicitudes', error.message);
  return (data as AccessRequestRow[] | null) ?? [];
}

/** ¿Tiene la solicitud todos los datos del registro? Las filas antiguas pueden estar incompletas. */
export function hasCompleteProfile(row: Pick<AccessRequestRow, 'username' | 'full_name' | 'course' | 'shift' | 'reason'>): boolean {
  return Boolean(row.username?.trim() && row.full_name?.trim() && row.course?.trim() && row.shift?.trim() && row.reason?.trim());
}
