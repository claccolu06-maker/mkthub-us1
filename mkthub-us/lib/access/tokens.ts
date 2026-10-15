/**
 * Tokens firmados con HMAC-SHA256 mediante Web Crypto.
 *
 * Un único código sirve en Node (rutas API y páginas) y en el runtime Edge
 * (middleware), así que no hay dos implementaciones que puedan desalinearse.
 * Solo usa APIs estándar: no importa módulos de Node.
 */

const encoder = new TextEncoder();
const decoder = new TextDecoder();

/** Clave de firma. Si ACCESS_SESSION_SECRET no existe se reutiliza la clave service-role de Supabase. */
export function getSigningSecret(): string | null {
  const secret = (process.env.ACCESS_SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  return secret.length >= 16 ? secret : null;
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let index = 0; index < bytes.length; index += 1) binary += String.fromCharCode(bytes[index]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(value: string): Uint8Array | null {
  if (!/^[A-Za-z0-9_-]*$/.test(value)) return null;
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  try {
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
    return bytes;
  } catch {
    return null;
  }
}

function importKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

export async function signToken(payload: Record<string, unknown>): Promise<string> {
  const secret = getSigningSecret();
  if (!secret) throw new Error('Falta ACCESS_SESSION_SECRET o SUPABASE_SERVICE_ROLE_KEY para firmar la sesión.');

  const encodedPayload = toBase64Url(encoder.encode(JSON.stringify(payload)));
  const key = await importKey(secret);
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(encodedPayload));
  return `${encodedPayload}.${toBase64Url(new Uint8Array(signature))}`;
}

/** Devuelve el contenido si la firma es válida; en cualquier otro caso, null. La caducidad la comprueba quien llama. */
export async function verifyToken(token: string | undefined | null): Promise<Record<string, unknown> | null> {
  if (!token || token.length > 4096) return null;

  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [encodedPayload, encodedSignature] = parts;

  const secret = getSigningSecret();
  if (!secret) return null;

  const signature = fromBase64Url(encodedSignature);
  const payloadBytes = fromBase64Url(encodedPayload);
  if (!signature || !payloadBytes) return null;

  try {
    const key = await importKey(secret);
    // crypto.subtle.verify compara en tiempo constante.
    const valid = await crypto.subtle.verify('HMAC', key, signature, encoder.encode(encodedPayload));
    if (!valid) return null;

    const parsed: unknown = JSON.parse(decoder.decode(payloadBytes));
    return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}
