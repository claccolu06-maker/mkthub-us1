# MktHub US

Agenda privada del curso (3º · Marketing): fechas de exámenes y entregas, apuntes de clase y dudas por asignatura. El acceso es **solo para quien la persona administradora apruebe**.

> Esta carpeta es un proyecto **nuevo y completo**, pensado para subirse a un repositorio de GitHub nuevo y desplegarse en un proyecto de Vercel nuevo. No toca el despliegue de Production del proyecto anterior.

**¿Quieres ponerlo en marcha?** Sigue la [guía paso a paso](docs/GUIA-PASO-A-PASO.md) (en español, sin conocimientos técnicos).

## Cómo funciona el acceso

1. La persona estudiante rellena el formulario en `/acceso` (nombre, usuario, correo, curso, turno y motivo). No hay contraseñas ni enlaces mágicos para estudiantes.
2. La solicitud queda **pendiente** y el navegador recibe una cookie firmada (`HttpOnly`, 180 días). La pantalla de espera consulta el estado sola.
3. La persona administradora recibe **un solo correo** con los botones *Aprobar* y *Denegar*. Los botones abren una página de confirmación (abrir el enlace nunca cambia nada por sí solo).
4. Al aprobar, el mismo navegador entra a la agenda. A los estudiantes **nunca** se les envía correo.
5. La agenda comprueba en la base de datos que la solicitud sigue aprobada en cada visita: revocar un acceso surte efecto al instante.
6. Si alguien cambia de navegador, puede recuperar su acceso con su correo y su usuario (pestaña *Ya envié mi solicitud*).

El panel de administración está en `/admin/accesos`. Entra solo `ACCESS_APPROVER_EMAIL`, con un enlace de un solo uso que Supabase envía a ese correo.

## Tecnología

| Pieza | Uso |
| --- | --- |
| Next.js 14 (App Router) + React 18 + TypeScript | Aplicación y rutas de servidor |
| Tailwind CSS | Estilos |
| Supabase | **Solo** como base de datos PostgreSQL (`public.access_requests`) y para el inicio de sesión de administración |
| Nodemailer (SMTP) | Aviso a administración con los botones Aprobar/Denegar |
| Zod | Validación de formularios y peticiones |
| Vercel | Alojamiento |

La agenda guarda los datos del curso en el navegador (`localStorage`, clave `mkthub_us_courses_v1`). Todavía **no** se comparten entre compañeros.

## Variables de entorno

Los nombres están en [`.env.example`](.env.example). **Nunca** subas valores reales a GitHub ni los pegues en un chat.

| Variable | ¿Obligatoria? | Para qué sirve |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Sí | Dirección de tu proyecto de Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sí | Clave pública (anon) de Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Sí | Clave de servidor. Solo en Vercel, jamás en el navegador |
| `ACCESS_APPROVER_EMAIL` | Sí | Correo de la persona administradora |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM_EMAIL` | Sí, para recibir avisos | Cuenta de correo que envía el aviso |
| `SITE_URL` | No | Dirección pública fija. Déjala vacía en Preview |
| `ACCESS_SESSION_SECRET` | No | Clave propia para firmar sesiones (por defecto se usa la service role) |

## Desarrollo en tu ordenador

Necesitas Node.js 18.18 o superior.

```bash
cp .env.example .env.local   # rellénalo con tus valores, solo en tu ordenador
npm install
npm run dev                  # http://localhost:3000
```

Otros comandos: `npm run typecheck`, `npm run lint`, `npm run build`.

## Estructura

```
app/                     Páginas y rutas (acceso, admin, API, agenda)
components/access/       Formulario de solicitud y pantalla de espera
components/admin/        Panel de administración y página de confirmación
components/agenda/       Agenda: asignaturas, panel lateral, fechas, apuntes, dudas
lib/access/              Sesiones firmadas, solicitudes, correo, validaciones
lib/agenda/              Estado de la agenda en el navegador
lib/supabase/            Clientes de Supabase (servidor)
middleware.ts            Puerta de entrada: cookie de sesión y protección de /admin
supabase/migrations/     SQL de la tabla de solicitudes (ejecutar una vez)
docs/                    Guías y decisiones de diseño
```

## Seguridad en pocas líneas

- Las claves de Supabase y de correo solo existen como variables de entorno del servidor; no hay secretos en el código.
- La tabla de solicitudes no es accesible desde el navegador (RLS activado y sin permisos para `anon`/`authenticated`).
- Las cookies y los enlaces de revisión se firman con HMAC-SHA256; los enlaces de revisión caducan a los 7 días.
- Límite de intentos y campo señuelo anti-bots en los formularios.
- Las páginas llevan `noindex` y `robots.txt` bloquea a los buscadores.

## Limitaciones conocidas

- El correo de quien solicita **no se verifica** (por diseño: no hay correos a estudiantes). La persona administradora decide viendo los datos.
- El límite de intentos está en memoria de cada instancia de Vercel: frena abusos simples, no ataques serios.
- Los datos de la agenda viven en cada navegador. Para compartirlos hará falta una base de datos compartida (siguiente paso natural).
- Más detalle en [`docs/DECISIONES.md`](docs/DECISIONES.md).
