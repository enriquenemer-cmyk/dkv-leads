-- Analítica propia de la web pública: visitas, clics (mapa de calor) y scroll.
-- Los visitantes NO están logueados (rol anon), así que se les permite SOLO insertar.
-- La lectura queda reservada a los asesores logueados del panel.

create table if not exists web_eventos (
  id          bigint generated always as identity primary key,
  session_id  text not null,                 -- id anónimo de sesión (sessionStorage)
  tipo        text not null,                 -- 'view' | 'click' | 'scroll'
  path        text not null,                 -- ruta visitada, p.ej. '/' o '/dkv/seguro'
  xr          real,                          -- clic: x relativo 0..1 (clientX / ancho ventana)
  yr          real,                          -- clic: y relativo 0..1 (posición en la página completa)
  scroll_pct  int,                           -- scroll: % máximo de página alcanzado (0..100)
  vw          int,                           -- ancho de ventana (para separar móvil/escritorio)
  elemento    text,                          -- clic: etiqueta legible del elemento pulsado
  created_at  timestamptz default now()
);

create index if not exists web_eventos_created_idx on web_eventos (created_at desc);
create index if not exists web_eventos_tipo_idx   on web_eventos (tipo);
create index if not exists web_eventos_path_idx   on web_eventos (path);

alter table web_eventos enable row level security;

-- Cualquier visitante (anon) o usuario logueado puede INSERTAR eventos.
create policy "web_eventos_insert" on web_eventos
  for insert to anon, authenticated with check (true);

-- Solo los usuarios logueados (asesores) pueden LEER la analítica.
create policy "web_eventos_select" on web_eventos
  for select to authenticated using (true);

-- IMPORTANTE: en este Supabase las políticas RLS no bastan; el rol anónimo
-- necesita además el GRANT a nivel de tabla o las inserciones dan error 42501.
grant insert on public.web_eventos to anon, authenticated;
grant select on public.web_eventos to authenticated;

-- Columnas ampliadas (fuente/campaña, ubicación, comportamiento y embudo).
-- Seguro de ejecutar varias veces: 'if not exists'.
alter table web_eventos add column if not exists referrer     text;
alter table web_eventos add column if not exists utm_source   text;
alter table web_eventos add column if not exists utm_medium   text;
alter table web_eventos add column if not exists utm_campaign text;
alter table web_eventos add column if not exists pais         text;
alter table web_eventos add column if not exists ciudad       text;
alter table web_eventos add column if not exists visitante    text;   -- 'nuevo' | 'recurrente'
alter table web_eventos add column if not exists dur          int;    -- duración de la sesión (segundos)
