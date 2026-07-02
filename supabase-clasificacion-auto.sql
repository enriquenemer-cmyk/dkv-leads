-- ============================================================
-- DKV Leads – Clasificación automática caliente/tibio/frío
-- Ejecutar en: Supabase → SQL Editor → RUN
-- ============================================================
-- Regla (solo para leads que entran solos por la web/formulario
-- y que AÚN NO tienen ninguna nota = no contactados):
--   • CALIENTE  → menos de 1 hora desde que entró
--   • TIBIO     → entre 1 y 2 horas
--   • FRÍO      → más de 2 horas
-- En cuanto el asesor añade una nota, el lead deja de cambiar solo.
-- Los leads creados a mano ('manual') y los 'cliente' no se tocan.
-- ============================================================

-- 1) Al entrar un lead de la web → arranca CALIENTE al instante
create or replace function public.lead_inicial_caliente()
returns trigger language plpgsql as $$
begin
  if (new.fuente like 'web%' or new.fuente like 'formulario%') then
    new.tag := 'caliente';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_lead_inicial on public.leads;
create trigger trg_lead_inicial
  before insert on public.leads
  for each row execute function public.lead_inicial_caliente();

-- 2) Función que enfría los leads no contactados según su antigüedad
create or replace function public.reclasificar_leads()
returns void language sql as $$
  update public.leads l
  set tag = nuevo.t
  from (
    select id,
      case
        when created_at > now() - interval '1 hour'  then 'caliente'
        when created_at > now() - interval '2 hours' then 'tibio'
        else 'frio'
      end as t
    from public.leads
    where (fuente like 'web%' or fuente like 'formulario%')  -- auto-inscritos
      and coalesce(jsonb_array_length(notas), 0) = 0         -- sin contactar (sin notas)
      and tag <> 'cliente'                                   -- nunca tocar clientes
  ) nuevo
  where l.id = nuevo.id
    and l.tag <> nuevo.t;                                    -- solo si cambia
$$;

-- 3) Programar la función cada 5 minutos (pg_cron)
create extension if not exists pg_cron;

-- Quita el trabajo anterior si ya existía (evita duplicados al re-ejecutar)
select cron.unschedule('reclasificar-leads')
where exists (select 1 from cron.job where jobname = 'reclasificar-leads');

select cron.schedule('reclasificar-leads', '*/5 * * * *',
  'select public.reclasificar_leads()');

-- 4) Ejecutar una vez ahora para poner al día los leads existentes
select public.reclasificar_leads();
