-- ============================================================================
-- MktHub US · tabla de solicitudes de acceso
--
-- Cómo usarlo: Supabase > SQL Editor > New query > pega TODO este archivo > Run.
--
-- Es seguro ejecutarlo varias veces y también sobre el proyecto de Supabase que
-- ya usabas: NO borra ni modifica ninguna fila existente (tu solicitud de prueba
-- se conserva tal cual). Solo crea lo que falta y retira restricciones que ya no
-- se usan.
-- ============================================================================

-- 1) Tabla base (si ya existe, esta orden no hace nada).
create table if not exists public.access_requests (
  user_id uuid primary key default gen_random_uuid(),
  email text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'denied')),
  requested_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users (id) on delete set null
);

-- 2) Columnas de la ficha de registro y del aviso a administración.
--    Quedan vacías (null) en las solicitudes antiguas.
alter table public.access_requests
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by uuid references auth.users (id) on delete set null,
  add column if not exists username text,
  add column if not exists full_name text,
  add column if not exists course text,
  add column if not exists shift text,
  add column if not exists reason text,
  add column if not exists admin_notified_at timestamptz;

-- 3) Las personas que piden acceso ya NO son usuarios de Supabase Auth:
--    el identificador de la solicitud lo genera la propia base de datos.
--    Se retira la vinculación con auth.users (sea cual sea su nombre).
alter table public.access_requests
  alter column user_id set default gen_random_uuid();

do $$
declare
  fk record;
begin
  for fk in
    select c.conname
    from pg_constraint c
    join pg_attribute a on a.attrelid = c.conrelid and a.attnum = any (c.conkey)
    where c.conrelid = 'public.access_requests'::regclass
      and c.contype = 'f'
      and a.attname = 'user_id'
  loop
    execute format('alter table public.access_requests drop constraint %I', fk.conname);
  end loop;
end $$;

-- 4) Turno: solo mañana o tarde (las filas antiguas sin turno siguen siendo válidas).
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'access_requests_shift_check'
      and conrelid = 'public.access_requests'::regclass
  ) then
    alter table public.access_requests
      add constraint access_requests_shift_check
      check (shift is null or shift in ('morning', 'afternoon'));
  end if;
end $$;

-- 5) Un correo = una solicitud (sin distinguir mayúsculas).
--    Si ya hubiese correos repetidos, no se toca nada: se avisa y se omite este paso.
do $$
begin
  if exists (
    select 1
    from public.access_requests
    group by lower(email)
    having count(*) > 1
  ) then
    raise notice 'Hay correos repetidos en access_requests: se omite el índice único por correo. Revísalos a mano.';
  else
    create unique index if not exists access_requests_email_lower_key
      on public.access_requests (lower(email));
  end if;
end $$;

create index if not exists access_requests_status_requested_at_idx
  on public.access_requests (status, requested_at asc);

-- 6) Seguridad: la tabla solo la toca el servidor con la clave service_role.
--    El navegador (clave anon) no puede leer ni escribir nada aquí.
alter table public.access_requests enable row level security;

revoke all on table public.access_requests from anon, authenticated;
grant all on table public.access_requests to service_role;

-- Fin. No hace falta ninguna política: sin políticas y sin permisos, anon y
-- authenticated no ven filas. La clave service_role nunca debe llegar al navegador.
