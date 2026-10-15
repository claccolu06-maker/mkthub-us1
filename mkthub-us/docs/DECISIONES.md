# Decisiones de diseño y mejoras

Este documento resume qué se mantuvo de la idea original, qué se cambió y por qué. Está pensado para quien mantenga el proyecto.

## Se mantiene (reglas del proyecto)

- Vercel como alojamiento; sin Excel.
- Estudiantes: formulario → pendiente → decisión de administración → entran desde el mismo navegador. **Sin** enlaces mágicos, contraseñas ni Auth.js para estudiantes. **Sin** correos a estudiantes.
- Administración recibe un único aviso con Aprobar/Denegar.
- Diseño de la agenda y almacenamiento en `localStorage` (clave `mkthub_us_courses_v1`).
- Solo despliegues Preview; ningún secreto en el código.

## Mejoras de arquitectura

| Antes (versión anterior) | Ahora | Motivo |
| --- | --- | --- |
| El inicio de sesión de administración usaba un cliente que no guardaba el verificador PKCE, pero el callback esperaba `?code=` | Cliente de servidor de `@supabase/ssr` en el envío del enlace y en el callback | El enlace del correo podía no completarse; ahora funciona abriéndolo en el mismo navegador |
| Reenviar una solicitud pendiente reiniciaba `requested_at` (invalidaba cookies y enlaces ya emitidos) | `requested_at` se conserva siempre | Estabilidad de sesiones y enlaces |
| El motivo del fallo del aviso llegaba al estudiante por la URL (`?notice=…`) | El estudiante ve un texto neutro; administración ve un distintivo, reintento y diagnóstico | No exponer fallos internos |
| Recuperación de acceso con `ILIKE` sobre el usuario (dependía de escapar comodines) | Comparación exacta en código (`usernameKey`) | Menos superficie de error |
| Sin registro de si ya se avisó a administración | Columna `admin_notified_at`; el reintento es idempotente | No duplicar correos al reenviar |
| Solo dos causas posibles de fallo del aviso (configuración o entrega) | Cinco (configuración, autenticación, conexión, tiempo agotado, desconocido) con una pista en español, y botón **Probar el correo** en el panel | Diagnosticar sin leer logs |
| Con la cookie firmada marcada como aprobada, el middleware dejaba pasar sin consultar la base de datos | Cookie firmada en el middleware **más** comprobación en base de datos en cada visita a la agenda | Revocar un acceso surte efecto al instante |

## Se mantiene y se refuerza

- Los botones *Aprobar/Denegar* del correo siguen abriendo una página de confirmación y la decisión se envía con `POST` y un token firmado de 7 días. La decisión por correo es idempotente (repetirla no cambia nada y avisa si ya se resolvió).
- El correo de quien solicita no recibe nunca mensajes; solo administración.

## Mejoras de diseño y usabilidad

- Un solo lenguaje visual (azul/violeta) en acceso, administración y agenda; se elimina la ruta de prototipo.
- Texto mínimo de 12 px, etiquetas visibles en todos los formularios, `aria-*` en pestañas y diálogos, foco atrapado en ventanas, `Esc` para cerrar y respeto a “reducir movimiento”.
- Errores por campo en el formulario de acceso y recuperación de acceso desde otro navegador (correo + usuario).
- Búsqueda de asignaturas insensible a tildes, filtro por cuatrimestre, “Añadir hito” con selector de asignatura.
- Aviso claro cuando el navegador no permite guardar datos.

## Datos

- `public.access_requests` es la única tabla. Se usa Supabase solo como PostgreSQL; el cliente de servidor usa la clave service_role y la tabla tiene RLS sin permisos para `anon`/`authenticated`.
- El SQL es idempotente y compatible con el proyecto de Supabase anterior: retira el vínculo `user_id → auth.users` (los estudiantes ya no son usuarios de Auth) sin tocar filas.

## Código de asignaturas

Los nueve cursos conservan los códigos y colores de la versión original. Siete identificadores internos (`id`) tuvieron que inferirse; por eso la carga desde `localStorage` empareja primero por `id` y, si no coincide, por `code`, de modo que ningún dato guardado se pierde.

## Siguientes pasos recomendados

1. Sincronizar la agenda entre compañeros (tabla compartida en Supabase) manteniendo el diseño actual.
2. Límite de intentos persistente (por ejemplo, con una tabla o un servicio de caché) si se abre a más gente.
3. Dominio propio para ocultar `vercel.app`.
4. Proveedor de correo por HTTPS si el puerto SMTP quedara bloqueado en Vercel.
