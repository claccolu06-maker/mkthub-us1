const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

/**
 * Dirección pública de la web para los enlaces de los correos.
 * Usa SITE_URL si está definida; si no, la dirección desde la que llega la petición
 * (así cada Preview de Vercel enlaza a sí mismo). Un SITE_URL de localhost se ignora
 * cuando la petición no viene de localhost.
 */
export function getSiteUrl(request: Request): string {
  const origin = new URL(request.url).origin;
  const configured = process.env.SITE_URL?.trim();
  if (!configured) return origin;

  try {
    const configuredUrl = new URL(configured);
    const requestIsLocal = LOCAL_HOSTS.has(new URL(origin).hostname);
    if (LOCAL_HOSTS.has(configuredUrl.hostname) && !requestIsLocal) return origin;
    return configuredUrl.origin;
  } catch {
    return origin;
  }
}
