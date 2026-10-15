# Guía paso a paso: de esta carpeta a tu web funcionando

Esta guía es para ti, sin conocimientos técnicos. Son **6 pasos** y puedes parar y seguir otro día.

**Reglas de oro**
- **Nunca pegues claves ni contraseñas en un chat** (ni conmigo ni con nadie). Se escriben solo en las pantallas de Supabase, Vercel o Google que se indican aquí.
- Todo va a un proyecto **nuevo** de Vercel y a un repositorio **nuevo** de GitHub. Tu web anterior (Production) no se toca.
- Los menús de GitHub, Vercel y Supabase cambian de vez en cuando: si un nombre no coincide al 100 %, busca el más parecido.

**Lo que necesitas tener a mano**
- Tu cuenta de GitHub, de Vercel y de Supabase (la misma que ya usabas).
- El correo de administración (el que aprobará las solicitudes).
- Una cuenta de Gmail para **enviar** los avisos (puede ser la misma u otra; mejor una dedicada).

---

## Paso 1 · Crear el repositorio nuevo en GitHub

1. Descomprime el ZIP `mkthub-us.zip`. Obtendrás una carpeta `mkthub-us`.
2. Entra en <https://github.com/new>.
3. **Repository name:** `mkthub-us`. Marca **Private** (privado). **No** marques ninguna casilla de “Add a README”, “.gitignore” ni “license”. Pulsa **Create repository**.

### Subir la carpeta — elige UNA opción

**Opción A (la más fácil): GitHub Desktop**
1. Instala <https://desktop.github.com> e inicia sesión.
2. Menú **File → Add local repository…** y elige la carpeta `mkthub-us` (ya viene preparada con su historial).
3. Pulsa **Publish repository**, deja marcado **Keep this code private** y **Publish**.

**Opción B: desde la web de GitHub**
1. En tu repositorio vacío pulsa **uploading an existing file**.
2. Arrastra el **contenido** de la carpeta `mkthub-us` (no la carpeta en sí). Si GitHub se queja de la cantidad de archivos, súbelo en dos tandas (primero `app`, `components` y `lib`; después el resto).
3. Pulsa **Commit changes**.

> Comprueba que en GitHub **no** aparece ningún archivo llamado `.env.local` ni nada con claves. No debería: solo existe `.env.example`, que tiene textos de ejemplo.

---

## Paso 2 · Preparar la base de datos en Supabase

Puedes usar el **mismo proyecto de Supabase** que ya tienes: se conserva tu solicitud de prueba. El SQL no borra ni cambia ninguna fila.

1. Entra en <https://supabase.com/dashboard> y abre tu proyecto.
2. Menú **SQL Editor → New query**.
3. Abre el archivo `supabase/migrations/20261015_mkthub_us_access.sql` (desde GitHub o desde la carpeta), copia **todo** su contenido, pégalo y pulsa **Run**. Debe terminar con “Success”.
4. Ve a **Authentication → URL Configuration**:
   - **No cambies “Site URL”** (lo usa tu web anterior).
   - En **Redirect URLs** pulsa **Add URL** y añade la dirección del nuevo proyecto cuando la tengas (Paso 3), con este formato: `https://TU-DIRECCION.vercel.app/auth/callback`.
   - Para no repetirlo en cada despliegue de prueba, puedes añadir también un patrón: `https://mkthub-us-*-TU-EQUIPO.vercel.app/**` (cambia `TU-EQUIPO` por la parte final de tu dirección de Vercel, justo antes de `.vercel.app`).

Apunta (solo para ti, no en un chat) dónde están estas tres cosas, las necesitarás en el Paso 3: en **Project Settings → API** verás la **Project URL**, la clave **anon public** y la clave **service_role**.

---

## Paso 3 · Crear el proyecto nuevo en Vercel (solo Preview)

1. Entra en <https://vercel.com/new> y elige tu repositorio `mkthub-us` → **Import**.
2. Proyecto nuevo, nombre `mkthub-us`. Framework: **Next.js** (se detecta solo).
3. En **Environment Variables** añade estas variables. Fíjate en el **ámbito**: desmarca *Production* y *Development* y deja marcado **solo Preview**.

   | Nombre | Qué poner |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | La Project URL de Supabase |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | La clave anon public |
   | `SUPABASE_SERVICE_ROLE_KEY` | La clave service_role (marca **Sensitive** si te lo ofrece) |
   | `ACCESS_APPROVER_EMAIL` | El correo de la persona administradora |
   | `SMTP_HOST` | `smtp.gmail.com` |
   | `SMTP_PORT` | `465` |
   | `SMTP_USER` | La cuenta de Gmail que envía los avisos |
   | `SMTP_PASSWORD` | La contraseña de aplicación (Paso 4) — **no** la contraseña normal |
   | `SMTP_FROM_EMAIL` | `MktHub US <la-misma-cuenta@gmail.com>` |

   Deja **sin crear** `SITE_URL` y `ACCESS_SESSION_SECRET`. No hacen falta.
4. **Antes de pulsar Deploy**, o justo después en **Settings → Environments → Production** (el nombre exacto puede variar), busca **Production Branch** y cámbiala por un nombre que no exista, por ejemplo `produccion`. Así la rama `main` se despliega como **Preview** y recibe las variables de arriba.
5. Pulsa **Deploy**. Si la primera vez falta alguna variable, añádela y haz **Redeploy** desde la pestaña *Deployments*.
6. Cuando termine, abre el despliegue y copia su dirección (`https://….vercel.app`). Vuelve al Paso 2.4 y añade `/auth/callback` a esa dirección en Supabase.

> **Si el despliegue falla al compilar:** abre el despliegue → *Build Logs*, copia **solo el texto del error** (sin claves) y pásamelo. Ten en cuenta que en el entorno donde preparé el proyecto no pude instalar paquetes, así que esta es la primera compilación real.

---

## Paso 4 · Preparar Gmail para enviar los avisos

1. Entra en <https://myaccount.google.com> con la cuenta que enviará los avisos.
2. **Seguridad → Verificación en dos pasos**: actívala si no lo está.
3. Abre <https://myaccount.google.com/apppasswords>, escribe un nombre (por ejemplo, `MktHub US`) y pulsa **Crear**. Google te muestra **16 letras**: cópialas directamente en la variable `SMTP_PASSWORD` de Vercel (Paso 3). No las compartas con nadie.
4. Si cambias variables en Vercel después de desplegar, haz **Redeploy** para que se apliquen.

---

## Paso 5 · Probar todo, con calma

**A. Entrar como administración**
1. Abre `https://TU-DIRECCION.vercel.app/admin/entrar` en tu navegador.
2. Escribe el correo de administración → **Enviar enlace de acceso**.
3. Abre el correo y pulsa el enlace **en ese mismo navegador** (si lo abres en otro, no funcionará: es una medida de seguridad). Llegarás a `/admin/accesos`.

**B. Probar el correo**
1. En el panel pulsa **Probar el correo**.
2. Si llega un mensaje de prueba, todo está bien. Si no, el panel te dice la causa en español (credenciales, conexión, variables que faltan…).

**C. Simular a un estudiante**
1. Abre una ventana de incógnito y entra en `https://TU-DIRECCION.vercel.app`. Te llevará a `/acceso`.
2. Rellena el formulario con datos de prueba y envía. Verás “Solicitud recibida”.
3. En el correo de administración llegará un aviso con **Aprobar** y **Denegar**. Pulsa **Aprobar** → se abre una página de confirmación → confírmala.
4. La ventana del estudiante entra sola a la agenda en pocos segundos.
5. Si prefieres decidir desde el panel, también puedes hacerlo en `/admin/accesos` (Pendientes, Aprobadas, Denegadas; se puede **Revocar acceso** en cualquier momento).

Si el correo de aviso no llegó, en el panel verás la solicitud con un distintivo y el botón **Reenviar aviso** (no duplica nada: reintenta solo si no se envió).

---

## Paso 6 · Que tus compañeros puedan abrirlo

Esto depende de Vercel, no de la aplicación (la aplicación no puede cambiarlo):

- **Protección de despliegues.** Por defecto los despliegues de Preview piden iniciar sesión en Vercel. En **Settings → Deployment Protection** puedes ajustarla; según tu plan de Vercel puede que no puedas desactivarla en Preview. Con la protección activa, tus compañeros verán la pantalla de Vercel antes de llegar a MktHub US.
- **Ocultar “vercel.app”.** Es otra cosa distinta: requiere un **dominio propio** (se compra aparte) añadido en **Settings → Domains**, asignado a una rama. No he inventado ningún dominio: cuando tengas uno, dímelo y te ayudo con los pasos.
- Mientras tanto, para una prueba pequeña puedes compartir la dirección de Preview con personas que tengan acceso a tu proyecto de Vercel.

---

## Cómo actualizar la web más adelante

Cada vez que cambies código en GitHub, Vercel crea un despliegue nuevo con las mismas variables. Con GitHub Desktop: *Commit to main* y *Push origin*.

## Si algo falla

| Qué ves | Qué significa | Qué hacer |
| --- | --- | --- |
| “Registro pendiente de configuración” en `/acceso` | Faltan variables de Supabase en Vercel | Revisa el Paso 3 y haz Redeploy |
| El enlace de administración no funciona | Lo abriste en otro navegador, o la dirección no está en Redirect URLs | Ábrelo en el mismo navegador donde lo pediste; revisa el Paso 2.4 |
| “Probar el correo” da error de credenciales | Contraseña de aplicación incorrecta o sin verificación en dos pasos | Repite el Paso 4 |
| “Probar el correo” da tiempo agotado | El entorno puede bloquear el puerto de correo | Dímelo: se puede cambiar a un proveedor de correo por HTTPS (con tu aprobación) |
| Supabase tarda en enviar el enlace de administración | El correo integrado de Supabase tiene límites por hora | Espera unos minutos, o configura un SMTP propio en Supabase → Authentication |
| Una solicitud antigua no se puede aprobar (“faltan datos”) | Se creó con la versión anterior y le faltan campos | El panel lo indica; no se modifica nada automáticamente |

## Qué no he podido comprobar

En el entorno donde preparé este proyecto no se pueden descargar paquetes de npm, así que **no he ejecutado** `npm run build` ni `npm run lint`. La lógica de las cookies y los enlaces firmados sí se probó con un test. El primer despliegue en Vercel es la comprobación real: si algo falla, pásame el texto del error (sin claves) y lo corrijo.

Por la misma razón el proyecto no incluye `package-lock.json` (el archivo que fija las versiones exactas). Funciona sin él, pero cuando el primer despliegue salga bien conviene generarlo una vez (`npm install` en tu ordenador) y subirlo, para que las versiones no cambien solas entre despliegues.
