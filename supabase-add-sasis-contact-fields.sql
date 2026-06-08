-- CMCSix Hospitals
-- Ergänzt SASIS-Spitalstammdaten um Dashboard-editierbare Kontaktfelder.
-- In Supabase SQL Editor ausführen.

-- 1) Physische SASIS-Tabelle erweitern.
alter table if exists public.sasis_hospitals
  add column if not exists contact_tel text,
  add column if not exists remarks text;

comment on column public.sasis_hospitals.contact_tel is 'Kontakt-Telefon für Dashboard/Disposition';
comment on column public.sasis_hospitals.remarks is 'Bemerkungen für Dashboard/Disposition';

-- 2) Falls sasis_hospitals_api eine physische Tabelle ist, ebenfalls erweitern.
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
  end if;
end $$;

-- 3) Falls sasis_hospitals_api eine View ist, neu aufbauen und die neuen Felder durchreichen.
do $$
begin
  if exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'sasis_hospitals_api'
      and c.relkind in ('v','m')
  ) then
    execute '
      create or replace view public.sasis_hospitals_api as
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
  end if;
end $$;

-- 4) Rechte für Demo-/Anon-Zugriff gemäss bestehender App offen halten.
grant select, update (contact_tel, remarks) on public.sasis_hospitals to anon, authenticated;

do $$
begin
  if exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'sasis_hospitals_api'
  ) then
    grant select on public.sasis_hospitals_api to anon, authenticated;
    begin
      grant update (contact_tel, remarks) on public.sasis_hospitals_api to anon, authenticated;
    exception when others then
      -- Views sind nicht immer direkt updatebar; die App versucht dann automatisch public.sasis_hospitals.
      null;
    end;
  end if;
end $$;
