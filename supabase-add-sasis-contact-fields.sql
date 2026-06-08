-- CMCSix Hospitals
-- Ergänzt SASIS-Spitalstammdaten um Dashboard-editierbare Kontaktfelder.
-- Sicher für bestehende sasis_hospitals_api Views mit anderer Spaltenreihenfolge.
-- In Supabase SQL Editor ausführen.

-- 1) Physische SASIS-Basistabelle erweitern.
alter table if exists public.sasis_hospitals
  add column if not exists contact_tel text,
  add column if not exists remarks text;

comment on column public.sasis_hospitals.contact_tel is 'Kontakt-Telefon für Dashboard/Disposition';
comment on column public.sasis_hospitals.remarks is 'Bemerkungen für Dashboard/Disposition';

-- 2) Rechte auf der Basistabelle vergeben.
-- Die Dashboard-Kontaktseite schreibt direkt auf public.sasis_hospitals.
grant select on public.sasis_hospitals to anon, authenticated;
grant update (contact_tel, remarks) on public.sasis_hospitals to anon, authenticated;

-- 3) Falls public.sasis_hospitals_api eine physische Tabelle ist, optional ebenfalls erweitern.
do $$
begin
  if exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'sasis_hospitals_api'
      and c.relkind = 'r'
  ) then
    alter table public.sasis_hospitals_api
      add column if not exists contact_tel text,
      add column if not exists remarks text;

    execute '
      update public.sasis_hospitals_api api
         set contact_tel = coalesce(api.contact_tel, src.contact_tel),
             remarks = coalesce(api.remarks, src.remarks)
        from public.sasis_hospitals src
       where api.id = src.id
    ';

    grant select on public.sasis_hospitals_api to anon, authenticated;
    grant update (contact_tel, remarks) on public.sasis_hospitals_api to anon, authenticated;
  end if;
end $$;

-- 4) Falls public.sasis_hospitals_api eine View ist:
-- Nicht per CREATE OR REPLACE VIEW ändern, weil PostgreSQL bestehende View-Spalten
-- nicht umbenennen/umsortieren darf. Stattdessen bleibt die View unverändert.
-- Die Kontakt-Editierseite lädt ggf. über sasis_hospitals_api, schreibt aber direkt in sasis_hospitals.
grant select on public.sasis_hospitals_api to anon, authenticated;

-- 5) PostgREST/Supabase Schema-Cache refreshen.
notify pgrst, 'reload schema';

-- 6) Kontrollabfrage.
select column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'sasis_hospitals'
  and column_name in ('contact_tel', 'remarks')
order by column_name;
