-- CMCSix Hospitals · Betten-Seed aus SASIS-Spitaltabelle
-- Voraussetzung:
-- 1) supabase-sasis-hospitals.sql wurde ausgeführt
-- 2) supabase-schema.sql wurde ausgeführt
-- 3) supabase-link-beds-to-sasis.sql wurde ausgeführt
--
-- Zweck:
-- Erstellt einen Basisdatensatz für Betten direkt aus public.sasis_hospitals.
-- Die SASIS-Daten sind damit die Stammdatenquelle; Spitäler/Fachgebiete werden nicht mehr im Seed doppelt gepflegt.
--
-- Verhalten:
-- - Fügt nur fehlende Betten ein.
-- - Überschreibt keine bestehenden Betten, Statusänderungen, Geschlechter oder Notizen.
-- - Kann mehrfach sicher ausgeführt werden.

with hospital_specialties as (
  select
    h.id as hospital_id,
    h.name as hospital_name,
    h.validity_area,
    h.partner_subgroup,
    s.specialty,
    s.specialty_index::int as specialty_index
  from public.sasis_hospitals h
  cross join lateral unnest(h.specialties) with ordinality as s(specialty, specialty_index)
), generated_beds as (
  select
    hs.hospital_id,
    hs.specialty,
    hs.specialty_index,
    gs.bed_no::int as bed_no,
    (hs.specialty_index::text || lpad(gs.bed_no::text, 2, '0')) as room,
    case when gs.bed_no % 2 = 1 then 'A' else 'B' end as bed,
    (array[
      'Standardbett',
      'Überwachungsbett',
      'Isolationsbett',
      'Kurzliegerbett',
      'Barrierefreies Bett'
    ])[1 + (((gs.bed_no + hs.specialty_index - 1) % 5)::int)] as type,
    case when gs.bed_no % 4 = 0 then 'Überwachung' else 'Normalpflege' end as care,
    (array[
      'free',
      'free',
      'occupied',
      'reserved',
      'cleaning',
      'blocked',
      'free',
      'occupied'
    ])[1 + (((gs.bed_no + hs.specialty_index - 1) % 8)::int)] as status
  from hospital_specialties hs
  cross join lateral generate_series(1, 8 + (((hs.specialty_index - 1) % 3)::int)) as gs(bed_no)
), prepared as (
  select
    hospital_id
      || '-' || regexp_replace(
        lower(translate(specialty, 'äöüÄÖÜéèàÉÈÀ/-', 'aouAOUeeaEEA--')),
        '[^a-z0-9]+',
        '-',
        'g'
      )
      || '-' || room as id,
    hospital_id,
    specialty,
    split_part(specialty, ' ', 1)
      || ' '
      || substr('ABCD', (1 + ((bed_no + specialty_index - 1) % 4))::int, 1) as station,
    room,
    bed,
    type,
    care,
    (type = 'Isolationsbett' or bed_no % 11 = 0) as isolation,
    (bed_no % 3 = 0) as oxygen,
    (type = 'Überwachungsbett') as monitoring,
    (type = 'Barrierefreies Bett') as accessible,
    'unassigned'::text as gender,
    status,
    ''::text as notes
  from generated_beds
)
insert into public.beds (
  id,
  hospital_id,
  specialty,
  station,
  room,
  bed,
  type,
  care,
  isolation,
  oxygen,
  monitoring,
  accessible,
  gender,
  status,
  notes
)
select
  id,
  hospital_id,
  specialty,
  station,
  room,
  bed,
  type,
  care,
  isolation,
  oxygen,
  monitoring,
  accessible,
  gender,
  status,
  notes
from prepared
on conflict (id) do nothing;

-- Kontrolle: Betten pro SASIS-Spital
select
  h.id as hospital_id,
  h.name,
  h.validity_area,
  count(b.id) as beds
from public.sasis_hospitals h
left join public.beds b on b.hospital_id = h.id
group by h.id, h.name, h.validity_area, h.sort_order
order by h.sort_order, h.name;

-- Kontrolle: Diese Abfrage sollte 0 Zeilen liefern.
select distinct b.hospital_id
from public.beds b
left join public.sasis_hospitals h on h.id = b.hospital_id
where h.id is null;
