-- CMCSix Hospitals
-- Hard Reset für Dashboard-Kontakt-Speichern.
-- Ziel: Funktion und Spalten in public neu anlegen, Rechte setzen, SQL-seitig testen,
-- danach PostgREST Schema Cache reloaden.

-- 1) Prüfen, dass du im richtigen Projekt bist.
select
  current_database() as current_database,
  current_schema() as current_schema,
  current_user as current_user;

-- 2) Spalten sicherstellen.
alter table public.sasis_hospitals
  add column if not exists contact_tel text,
  add column if not exists remarks text;

-- 3) Alte Varianten der Funktion entfernen.
drop function if exists public.update_sasis_contact_fields(text, text, text);
drop function if exists public.update_sasis_contact_fields(jsonb);

-- 4) Funktion exakt mit den Parametern erstellen, die supabase-js sendet.
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

-- 5) Rechte setzen.
grant usage on schema public to anon, authenticated;
grant select on public.sasis_hospitals to anon, authenticated;
grant update (contact_tel, remarks) on public.sasis_hospitals to anon, authenticated;
grant execute on function public.update_sasis_contact_fields(text, text, text) to anon, authenticated;

-- 6) Funktion und Spalten SQL-seitig prüfen.
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

select column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'sasis_hospitals'
  and column_name in ('contact_tel', 'remarks')
order by column_name;

-- 7) Direkter SQL-Test mit Rollback. Muss ohne Fehler laufen.
begin;
select *
from public.update_sasis_contact_fields(
  '+41 TEST',
  (select id::text from public.sasis_hospitals limit 1),
  'RPC TEST'
);
rollback;

-- 8) PostgREST / Supabase REST Schema Cache reloaden.
select pg_notify('pgrst', 'reload schema');
notify pgrst, 'reload schema';
