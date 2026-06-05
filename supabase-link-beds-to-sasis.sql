-- CMCSix Hospitals · Betten mit SASIS-Spitaltabelle verknüpfen
-- Voraussetzung: supabase-sasis-hospitals.sql wurde bereits erfolgreich ausgeführt.
-- Diese Migration ergänzt einen Foreign Key von beds.hospital_id auf sasis_hospitals.id.
-- Bestehende ungültige Betten würden die Constraint-Erstellung verhindern; die Kontrollabfrage unten zeigt solche Fälle.

-- 1) Kontrolle: Diese Abfrage sollte 0 Zeilen liefern.
select distinct b.hospital_id
from public.beds b
left join public.sasis_hospitals h on h.id = b.hospital_id
where h.id is null;

-- 2) Foreign Key nur anlegen, falls er noch nicht existiert.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'beds_hospital_id_fkey'
      and conrelid = 'public.beds'::regclass
  ) then
    alter table public.beds
    add constraint beds_hospital_id_fkey
    foreign key (hospital_id)
    references public.sasis_hospitals(id)
    on update cascade
    on delete restrict;
  end if;
end $$;

-- 3) Kontrolle: Constraint muss danach sichtbar sein.
select
  conname as constraint_name,
  conrelid::regclass as table_name,
  confrelid::regclass as referenced_table
from pg_constraint
where conname = 'beds_hospital_id_fkey';
