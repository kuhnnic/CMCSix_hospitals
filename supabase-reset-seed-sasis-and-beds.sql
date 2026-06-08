-- CMCSix Hospitals · Komplett-Reset Seed für SASIS-Spitäler und Betten
-- Im Supabase SQL Editor ausführen.
-- ACHTUNG: Diese Datei löscht bestehende Daten in public.beds und public.sasis_hospitals.
--
-- Voraussetzungen:
-- - supabase-sasis-hospitals.sql wurde mindestens einmal ausgeführt oder die Tabelle public.sasis_hospitals existiert.
-- - supabase-schema.sql wurde mindestens einmal ausgeführt oder die Tabelle public.beds existiert.
-- - supabase-link-beds-to-sasis.sql wurde ausgeführt, wenn der Foreign Key aktiv sein soll.
-- - supabase-room-bed-rules.sql wurde ausgeführt, wenn DB-Regeln aktiv sein sollen.
--
-- Seed-Regeln:
-- - beds.hospital_id verweist auf sasis_hospitals.id.
-- - Innerhalb eines Spitals sind Bett-IDs eindeutig.
-- - Innerhalb eines Spitals wird jede Zimmernummer nur als ein logisches Zimmer verwendet.
-- - Pro Zimmer werden 1 bis 4 Betten erzeugt.
-- - Isolationsbetten stehen immer alleine in einem Zimmer.
-- - Alle Betten im selben Zimmer erhalten denselben Gender-Status.
-- - Gender wird befüllt: unassigned, female oder male.

begin;

delete from public.beds;
delete from public.sasis_hospitals;

insert into public.sasis_hospitals (
  id, name, street, place, validity_area, partner_group, partner_subgroup, zsr, specialties, sort_order
) values
('luks-luzern','LUKS Spitalbetriebe AG','Kantonsspital 37','6004 Luzern','Luzern','Spitäler','Zentrumsversorgung, Niveau 2','X067503',array['Innere Medizin','Chirurgie','Notfall','Intensivpflege','Geburtshilfe','Pädiatrie','Orthopädie','Kardiologie'],10),
('luks-sursee','LUKS Spitalbetriebe AG','Spitalstrasse 16A','6210 Sursee','Luzern','Spitäler','Zentrumsversorgung, Niveau 2','A626203',array['Innere Medizin','Chirurgie','Notfall','Intensivpflege','Geburtshilfe','Pädiatrie','Orthopädie','Kardiologie'],20),
('luks-wolhusen','LUKS Spitalbetriebe AG','Spitalstrasse 50','6110 Wolhusen','Luzern','Spitäler','Zentrumsversorgung, Niveau 2','A623603',array['Innere Medizin','Chirurgie','Notfall','Intensivpflege','Geburtshilfe','Pädiatrie','Orthopädie','Kardiologie'],30),
('luks-ks37','LUKS Spitalbetriebe AG','Kantonsspital 37','6004 Luzern','Luzern','Spitäler','Zentrumsversorgung, Niveau 2','A621003',array['Innere Medizin','Chirurgie','Notfall','Intensivpflege','Geburtshilfe','Pädiatrie','Orthopädie','Kardiologie'],40),
('st-anna','Klinik St. Anna','St. Anna-Strasse 32','6006 Luzern','Luzern','Spitäler','Zentrumsversorgung, Niveau 2','O709403',array['Innere Medizin','Chirurgie','Notfall','Intensivpflege','Geburtshilfe','Pädiatrie','Orthopädie','Kardiologie'],50),
('sonnmatt','Zurzach Care Rehaklinik Sonnmatt Luzern','Sonnmatt 1','6006 Luzern','Luzern','Spitäler','Rehabilitationskliniken','J167703',array['Rehabilitation','Geriatrische Reha','Neurologische Reha','Orthopädische Reha'],60),
('ks-aarau','Kantonsspital Aarau AG','Tellstrasse','5001 Aarau','Aargau','Spitäler','Zentrumsversorgung, Niveau 2','M700419',array['Innere Medizin','Chirurgie','Notfall','Intensivpflege','Geburtshilfe','Pädiatrie','Orthopädie','Kardiologie'],70),
('ks-obwalden','Kantonsspital Obwalden','Brünigstrasse 181','6060 Sarnen','Obwalden','Spitäler','Grundversorgung, Niveau 3','B708006',array['Innere Medizin','Chirurgie','Notfall','Geriatrie'],80),
('lups-sarnen','Luzerner Psychiatrie AG','Brünigstrasse 183','6060 Sarnen','Obwalden','Spitäler','Psychiatrische Kliniken, Niveau 1','K012606',array['Akutpsychiatrie','Alterspsychiatrie','Kinder-/Jugendpsychiatrie','Krisenintervention'],90),
('spital-nidwalden','Spital Nidwalden','Ennetmooserstrasse 19','6370 Stans','Nidwalden','Spitäler','Grundversorgung, Niveau 4','G709007',array['Innere Medizin','Chirurgie','Notfall','Geriatrie'],100),
('forensik','Forensische Psychiatrie','Seeblickstrasse 3','8596 Münsterlingen','Thurgau','Spitäler','Psychiatrische Kliniken, Niveau 1','I551820',array['Akutpsychiatrie','Alterspsychiatrie','Kinder-/Jugendpsychiatrie','Krisenintervention'],110),
('kjpd','Kinder- und Jugendpsychiatrischer Dienst - KJPD','Seeblickstrasse 3','8596 Münsterlingen','Thurgau','Spitäler','Psychiatrische Kliniken, Niveau 1','N777320',array['Akutpsychiatrie','Alterspsychiatrie','Kinder-/Jugendpsychiatrie','Krisenintervention'],120),
('ksk','Klinik St. Katharinental (KSK)','St. Katharinental 7','8253 Diessenhofen','Thurgau','Spitäler','Rehabilitationskliniken','A703720',array['Rehabilitation','Geriatrische Reha','Neurologische Reha','Orthopädische Reha'],130),
('pk-muensterlingen','Psychiatrische Klinik Münsterlingen','Seeblickstrasse 3','8596 Münsterlingen','Thurgau','Spitäler','Psychiatrische Kliniken, Niveau 1','A714420',array['Akutpsychiatrie','Alterspsychiatrie','Kinder-/Jugendpsychiatrie','Krisenintervention'],140),
('stg-frauenfeld','Spital Thurgau AG','Pfaffenholzstrasse 4','8500 Frauenfeld','Thurgau','Spitäler','Zentrumsversorgung, Niveau 2','P706820',array['Innere Medizin','Chirurgie','Notfall','Intensivpflege','Geburtshilfe','Pädiatrie','Orthopädie','Kardiologie'],150),
('stg-muensterlingen','Spital Thurgau AG','Spitalcampus 1','8596 Münsterlingen','Thurgau','Spitäler','Zentrumsversorgung, Niveau 2','X714320',array['Innere Medizin','Chirurgie','Notfall','Intensivpflege','Geburtshilfe','Pädiatrie','Orthopädie','Kardiologie'],160);

with hospital_specialties as (
  select h.id as hospital_id, h.name as hospital_name, h.validity_area, h.partner_subgroup, s.specialty, s.specialty_index::int as specialty_index
  from public.sasis_hospitals h
  cross join lateral unnest(h.specialties) with ordinality as s(specialty, specialty_index)
), room_templates as (
  select * from (values
    -- room_variant, bed_count, gender, isolation_room, room_kind
    (1, 1, 'unassigned', true,  'Isolationszimmer'),
    (2, 2, 'female',     false, 'Zweibettzimmer'),
    (3, 2, 'male',       false, 'Zweibettzimmer'),
    (4, 4, 'female',     false, 'Vierbettzimmer'),
    (5, 1, 'unassigned', false, 'Einbettzimmer')
  ) as rt(room_variant, bed_count, gender, isolation_room, room_kind)
), rooms as (
  select
    hs.hospital_id,
    hs.specialty,
    hs.specialty_index,
    rt.room_variant,
    rt.bed_count,
    rt.gender,
    rt.isolation_room,
    rt.room_kind,
    (hs.specialty_index::text || lpad(rt.room_variant::text, 2, '0')) as room
  from hospital_specialties hs
  cross join room_templates rt
), generated_beds as (
  select
    r.hospital_id,
    r.specialty,
    r.specialty_index,
    r.room_variant,
    r.room,
    chr(64 + bed_no)::text as bed,
    r.gender,
    r.isolation_room,
    case
      when r.isolation_room then 'Isolationsbett'
      when r.room_variant = 2 and bed_no = 1 then 'Überwachungsbett'
      when r.room_variant = 5 then 'Barrierefreies Bett'
      when r.room_variant = 4 and bed_no = 4 then 'Kurzliegerbett'
      else 'Standardbett'
    end as type,
    case when r.room_variant = 2 and bed_no = 1 then 'Überwachung' else 'Normalpflege' end as care,
    (array['free','reserved','occupied','cleaning','blocked','free','occupied','free'])[1 + (((r.specialty_index + r.room_variant + bed_no - 3) % 8)::int)] as status
  from rooms r
  cross join lateral generate_series(1, r.bed_count) as gs(bed_no)
), prepared as (
  select
    hospital_id || '-' || room || '-' || bed as id,
    hospital_id,
    specialty,
    split_part(specialty, ' ', 1) || ' ' || substr('ABCD', (1 + ((specialty_index - 1) % 4))::int, 1) as station,
    room,
    bed,
    type,
    care,
    isolation_room as isolation,
    (type in ('Überwachungsbett','Isolationsbett')) as oxygen,
    (type = 'Überwachungsbett') as monitoring,
    (type = 'Barrierefreies Bett') as accessible,
    gender,
    status,
    case
      when isolation_room then 'Seed: Isolationszimmer, Einzelbelegung'
      when room_variant = 4 then 'Seed: Mehrbettzimmer, gleicher Gender-Status'
      else ''
    end as notes
  from generated_beds
)
insert into public.beds (
  id, hospital_id, specialty, station, room, bed, type, care,
  isolation, oxygen, monitoring, accessible, gender, status, notes
)
select
  id, hospital_id, specialty, station, room, bed, type, care,
  isolation, oxygen, monitoring, accessible, gender, status, notes
from prepared
order by hospital_id, specialty, room, bed;

commit;

-- Kontrollen nach dem Reset
select count(*) as sasis_hospitals from public.sasis_hospitals;

select h.id as hospital_id, h.name, h.validity_area, count(b.id) as beds
from public.sasis_hospitals h
left join public.beds b on b.hospital_id = h.id
group by h.id, h.name, h.validity_area, h.sort_order
order by h.sort_order, h.name;

-- Sollte 0 Zeilen liefern.
select distinct b.hospital_id
from public.beds b
left join public.sasis_hospitals h on h.id = b.hospital_id
where h.id is null;

-- Sollte 0 Zeilen liefern.
select hospital_id, room, count(*) as bed_count
from public.beds
group by hospital_id, room
having count(*) > 4;

-- Sollte 0 Zeilen liefern.
select hospital_id, room, count(*) as bed_count
from public.beds
where (hospital_id, room) in (
  select hospital_id, room
  from public.beds
  where isolation = true
)
group by hospital_id, room
having count(*) > 1;

-- Sollte 0 Zeilen liefern.
select hospital_id, room, count(distinct gender) as genders
from public.beds
group by hospital_id, room
having count(distinct gender) > 1;

-- Sollte 0 Zeilen liefern.
select hospital_id, id, count(*) as duplicates
from public.beds
group by hospital_id, id
having count(*) > 1;

-- Sollte 0 Zeilen liefern.
select id, hospital_id, gender
from public.beds
where gender not in ('unassigned','female','male');
