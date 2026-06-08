-- CMCSix Hospitals
-- Fix für PGRST204: Could not find the 'contact_tel' column of 'sasis_hospitals' in the schema cache
-- In Supabase SQL Editor ausführen.

-- 1) Sicherstellen, dass die Spalten wirklich existieren.
alter table public.sasis_hospitals
  add column if not exists contact_tel text,
  add column if not exists remarks text;

-- 2) Rechte für die Dashboard-Demo setzen.
grant select on public.sasis_hospitals to anon, authenticated;
grant update (contact_tel, remarks) on public.sasis_hospitals to anon, authenticated;

grant select on public.sasis_hospitals_api to anon, authenticated;

-- 3) PostgREST/Supabase Schema-Cache neu laden.
select pg_notify('pgrst', 'reload schema');
notify pgrst, 'reload schema';

-- 4) Kontrollabfrage: muss zwei Zeilen liefern.
select
  table_schema,
  table_name,
  column_name,
  data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'sasis_hospitals'
  and column_name in ('contact_tel', 'remarks')
order by column_name;

-- 5) Schreibtest mit Rollback: darf keine Fehlermeldung werfen.
begin;
update public.sasis_hospitals
   set contact_tel = contact_tel,
       remarks = remarks
 where id = (select id from public.sasis_hospitals limit 1);
rollback;
