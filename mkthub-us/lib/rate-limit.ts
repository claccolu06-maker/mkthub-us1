interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

/**
 * Límite de intentos en memoria. En Vercel cada instancia tiene su propio contador,
 * así que frena el abuso casual (bots que rellenan el formulario) pero no es una barrera absoluta.
 * Devuelve true si la petición puede continuar.
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();

  if (buckets.size > 5_000) {
    buckets.forEach((bucket, bucketKey) => {
      if (bucket.resetAt <= now) buckets.delete(bucketKey);
    });
  }

  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  current.count += 1;
  return current.count <= limit;
}
