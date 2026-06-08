-- CMCSix Hospitals
-- Finale, idempotente Einrichtung für Dashboard-Kontaktfelder.
-- Im Supabase Projekt ausführen, das in supabase-config.js verwendet wird:
-- Project Ref: wlmsbsxgzmkkhwsimcdj

-- 1) Prüfen, ob du im richtigen Projekt bist.
select
  current_database() as current_database,
  current_schema() as current_schema,
  current_user as current_user;

-- 2) Basistabelle muss vorhanden sein.
do $$
begin
  if not exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'sasis_hospitals'
  ) then
    raise exception 'public.sasis_hospitals does not exist in this project/schema';
  end if;
end $$;

-- 3) Kontaktfelder dauerhaft in der Basistabelle anlegen.
alter table public.sasis_hospitals
  add column if not exists contact_tel text,
  add column if not exists remarks text;

comment on column public.sasis_hospitals.contact_tel is 'Kontakt-Telefon für Dashboard/Disposition';
comment on column public.sasis_hospitals.remarks is 'Bemerkungen für Dashboard/Disposition';

-- 4) Kontakte in API-View verfügbar machen.
-- Falls sasis_hospitals_api eine View ohne diese Spalten ist, sauber neu erstellen.
do $$
declare
  rel_kind char;
begin
  select c.relkind
    into rel_kind
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public'
     and c.relname = 'sasis_hospitals_api';

  if rel_kind in ('v','m') then
    execute 'drop view if exists public.sasis_hospitals_api cascade';
    execute '
      create view public.sasis_hospitals_api as
      select
        id,
        zsr,
        name,
        street,
        place,
        validity_area,
        partner_subgroup,
        specialties,
        sort_order,
        contact_tel,
        remarks
      from public.sasis_hospitals
    ';
  elsif rel_kind is null then
    execute '
      create view public.sasis_hospitals_api as
      select
        id,
        zsr,
        name,
        street,
        place,
        validity_area,
        partner_subgroup,
        specialties,
        sort_order,
        contact_tel,
        remarks
      from public.sasis_hospitals
    ';
  elsif rel_kind = 'r' then
    alter table public.sasis_hospitals_api
      add column if not exists contact_tel text,
      add column if not exists remarks text;
  end if;
end $$;

-- 5) RPC hart neu erstellen. Parameterreihenfolge entspricht PostgREST-Fehlermeldung.
drop function if exists public.update_sasis_contact_fields(text, text, text);
drop function if exists public.update_sasis_contact_fields(jsonb);

create function public.update_sasis_contact_fields(
  p_contact_tel text,
  p_id text,
  p_remarks text
)
returns table (
  id text,
  contact_tel text,
  remarks text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.sasis_hospitals h
     set contact_tel = p_contact_tel,
         remarks = p_remarks
   where h.id::text = p_id;

  if not found then
    raise exception 'No hospital found for id %', p_id using errcode = 'P0002';
  end if;

  return query
  select h.id::text, h.contact_tel, h.remarks
    from public.sasis_hospitals h
   where h.id::text = p_id;
end;
$$;

-- 6) Rechte setzen.
grant usage on schema public to anon, authenticated;
grant select on public.sasis_hospitals to anon, authenticated;
grant update (contact_tel, remarks) on public.sasis_hospitals to anon, authenticated;
grant select on public.sasis_hospitals_api to anon, authenticated;
grant execute on function public.update_sasis_contact_fields(text, text, text) to anon, authenticated;

-- 7) Kontrollabfragen.
select column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'sasis_hospitals'
  and column_name in ('contact_tel', 'remarks')
order by column_name;

select column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'sasis_hospitals_api'
  and column_name in ('contact_tel', 'remarks')
order by column_name;

select
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  has_function_privilege('anon', p.oid, 'EXECUTE') as anon_can_execute,
  has_function_privilege('authenticated', p.oid, 'EXECUTE') as authenticated_can_execute
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname = 'update_sasis_contact_fields';

-- 8) SQL-seitiger Funktionstest mit Rollback.
begin;
select *
from public.update_sasis_contact_fields(
  '+41 TEST',
  (select id::text from public.sasis_hospitals limit 1),
  'RPC TEST'
);
rollback;

-- 9) PostgREST Schema-Cache reloaden.
select pg_notify('pgrst', 'reload schema');
notify pgrst, 'reload schema';
