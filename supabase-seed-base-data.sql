-- CMCSix Hospitals · Basisdatensatz für alle Spitäler
-- Nach supabase-schema.sql im Supabase SQL Editor ausführen.
-- Fügt fehlende Basisbetten für alle 16 Spitäler ein.
-- Bestehende Betten/Statusänderungen werden wegen ON CONFLICT DO NOTHING nicht überschrieben.

with hospitals as (
  select * from (values
    ('luks-luzern','LUKS Spitalbetriebe AG','Luzern','Zentrumsversorgung, Niveau 2',array['Innere Medizin','Chirurgie','Notfall','Intensivpflege','Geburtshilfe','Pädiatrie','Orthopädie','Kardiologie']),
    ('luks-sursee','LUKS Spitalbetriebe AG','Luzern','Zentrumsversorgung, Niveau 2',array['Innere Medizin','Chirurgie','Notfall','Intensivpflege','Geburtshilfe','Pädiatrie','Orthopädie','Kardiologie']),
    ('luks-wolhusen','LUKS Spitalbetriebe AG','Luzern','Zentrumsversorgung, Niveau 2',array['Innere Medizin','Chirurgie','Notfall','Intensivpflege','Geburtshilfe','Pädiatrie','Orthopädie','Kardiologie']),
    ('luks-ks37','LUKS Spitalbetriebe AG','Luzern','Zentrumsversorgung, Niveau 2',array['Innere Medizin','Chirurgie','Notfall','Intensivpflege','Geburtshilfe','Pädiatrie','Orthopädie','Kardiologie']),
    ('st-anna','Klinik St. Anna','Luzern','Zentrumsversorgung, Niveau 2',array['Innere Medizin','Chirurgie','Notfall','Intensivpflege','Geburtshilfe','Pädiatrie','Orthopädie','Kardiologie']),
    ('sonnmatt','Zurzach Care Rehaklinik Sonnmatt Luzern','Luzern','Rehabilitationskliniken',array['Rehabilitation','Geriatrische Reha','Neurologische Reha','Orthopädische Reha']),
    ('ks-aarau','Kantonsspital Aarau AG','Aargau','Zentrumsversorgung, Niveau 2',array['Innere Medizin','Chirurgie','Notfall','Intensivpflege','Geburtshilfe','Pädiatrie','Orthopädie','Kardiologie']),
    ('ks-obwalden','Kantonsspital Obwalden','Obwalden','Grundversorgung, Niveau 3',array['Innere Medizin','Chirurgie','Notfall','Geriatrie']),
    ('lups-sarnen','Luzerner Psychiatrie AG','Obwalden','Psychiatrische Kliniken, Niveau 1',array['Akutpsychiatrie','Alterspsychiatrie','Kinder-/Jugendpsychiatrie','Krisenintervention']),
    ('spital-nidwalden','Spital Nidwalden','Nidwalden','Grundversorgung, Niveau 4',array['Innere Medizin','Chirurgie','Notfall','Geriatrie']),
    ('forensik','Forensische Psychiatrie','Thurgau','Psychiatrische Kliniken, Niveau 1',array['Akutpsychiatrie','Alterspsychiatrie','Kinder-/Jugendpsychiatrie','Krisenintervention']),
    ('kjpd','Kinder- und Jugendpsychiatrischer Dienst - KJPD','Thurgau','Psychiatrische Kliniken, Niveau 1',array['Akutpsychiatrie','Alterspsychiatrie','Kinder-/Jugendpsychiatrie','Krisenintervention']),
    ('ksk','Klinik St. Katharinental (KSK)','Thurgau','Rehabilitationskliniken',array['Rehabilitation','Geriatrische Reha','Neurologische Reha','Orthopädische Reha']),
    ('pk-muensterlingen','Psychiatrische Klinik Münsterlingen','Thurgau','Psychiatrische Kliniken, Niveau 1',array['Akutpsychiatrie','Alterspsychiatrie','Kinder-/Jugendpsychiatrie','Krisenintervention']),
    ('stg-frauenfeld','Spital Thurgau AG','Thurgau','Zentrumsversorgung, Niveau 2',array['Innere Medizin','Chirurgie','Notfall','Intensivpflege','Geburtshilfe','Pädiatrie','Orthopädie','Kardiologie']),
    ('stg-muensterlingen','Spital Thurgau AG','Thurgau','Zentrumsversorgung, Niveau 2',array['Innere Medizin','Chirurgie','Notfall','Intensivpflege','Geburtshilfe','Pädiatrie','Orthopädie','Kardiologie'])
  ) as h(hospital_id, hospital_name, validity_area, partner_subgroup, specialties)
), expanded as (
  select
    h.hospital_id,
    s.specialty,
    s.specialty_index::int as specialty_index,
    bed_no::int as bed_no,
    (s.specialty_index::text || lpad(bed_no::text, 2, '0')) as room,
    case when bed_no % 2 = 1 then 'A' else 'B' end as bed,
    (array['Standardbett','Überwachungsbett','Isolationsbett','Kurzliegerbett','Barrierefreies Bett'])[1 + (((bed_no + s.specialty_index - 1) % 5)::int)] as bed_type,
    case when bed_no % 4 = 0 then 'Überwachung' else 'Normalpflege' end as care,
    (array['free','free','occupied','reserved','cleaning','blocked','free','occupied'])[1 + (((bed_no + s.specialty_index - 1) % 8)::int)] as status
  from hospitals h
  cross join lateral unnest(h.specialties) with ordinality as s(specialty, specialty_index)
  cross join lateral generate_series(1, 8 + (((s.specialty_index - 1) % 3)::int)) as bed_no
), prepared as (
  select
    hospital_id || '-' || regexp_replace(lower(translate(specialty, 'äöüÄÖÜéèàÉÈÀ/-', 'aouAOUeeaEEA--')), '[^a-z0-9]+', '-', 'g') || '-' || room as id,
    hospital_id,
    specialty,
    split_part(specialty, ' ', 1) || ' ' || substr('ABCD', (1 + ((bed_no + specialty_index - 1) % 4))::int, 1) as station,
    room,
    bed,
    bed_type as type,
    care,
    (bed_type = 'Isolationsbett' or bed_no % 11 = 0) as isolation,
    (bed_no % 3 = 0) as oxygen,
    (bed_type = 'Überwachungsbett') as monitoring,
    (bed_type = 'Barrierefreies Bett') as accessible,
    'unassigned'::text as gender,
    status,
    ''::text as notes
  from expanded
)
insert into public.beds (
  id, hospital_id, specialty, station, room, bed, type, care,
  isolation, oxygen, monitoring, accessible, gender, status, notes
)
select
  id, hospital_id, specialty, station, room, bed, type, care,
  isolation, oxygen, monitoring, accessible, gender, status, notes
from prepared
on conflict (id) do nothing;

-- Kontrolle: Anzahl Basisbetten pro Spital
select hospital_id, count(*) as beds
from public.beds
group by hospital_id
order by hospital_id;
