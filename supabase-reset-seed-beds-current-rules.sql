-- Reset seed for beds using existing public.sasis_hospitals.
-- Deletes all rows in public.beds and recreates demo beds.
-- Rules:
-- - occupied/reserved beds always use female or male
-- - free beds in a room with occupied/reserved beds use the same gender
-- - unassigned is only used in rooms without occupied/reserved beds
-- - max 4 beds per room
-- - isolation beds are alone in their room

begin;

delete from public.beds;

with hs as (
  select h.id as hospital_id, s.specialty, s.idx::int as specialty_index
  from public.sasis_hospitals h
  cross join lateral unnest(h.specialties) with ordinality as s(specialty, idx)
), room_templates as (
  select * from (values
    (1, 1, 'unassigned', true,  array['free']),
    (2, 2, 'female',     false, array['occupied','free']),
    (3, 2, 'male',       false, array['reserved','free']),
    (4, 4, 'female',     false, array['occupied','reserved','free','free']),
    (5, 1, 'unassigned', false, array['cleaning'])
  ) as t(room_variant, bed_count, gender, isolation_room, status_pattern)
), generated as (
  select
    hs.hospital_id,
    hs.specialty,
    hs.specialty_index,
    t.room_variant,
    (hs.specialty_index::text || lpad(t.room_variant::text, 2, '0')) as room,
    chr(64 + bed_no)::text as bed,
    t.gender,
    t.isolation_room,
    t.status_pattern[bed_no] as status,
    bed_no::int as bed_no
  from hs
  cross join room_templates t
  cross join lateral generate_series(1, t.bed_count) as bed_no
), prepared as (
  select
    hospital_id || '-' || room || '-' || bed as id,
    hospital_id,
    specialty,
    split_part(specialty, ' ', 1) || ' ' || substr('ABCD', (1 + ((specialty_index - 1) % 4))::int, 1) as station,
    room,
    bed,
    case
      when isolation_room then 'Isolationsbett'
      when room_variant = 2 and bed_no = 1 then 'Überwachungsbett'
      when room_variant = 5 then 'Barrierefreies Bett'
      when room_variant = 4 and bed_no = 4 then 'Kurzliegerbett'
      else 'Standardbett'
    end as type,
    case when room_variant = 2 and bed_no = 1 then 'Überwachung' else 'Normalpflege' end as care,
    isolation_room as isolation,
    (isolation_room or (room_variant = 2 and bed_no = 1)) as oxygen,
    (room_variant = 2 and bed_no = 1) as monitoring,
    (room_variant = 5) as accessible,
    gender,
    status,
    case
      when status in ('occupied','reserved') then 'Seed: assigned gender required'
      when status = 'free' and gender in ('female','male') then 'Seed: free bed follows assigned room gender'
      when gender = 'unassigned' then 'Seed: room has no occupied/reserved bed'
      else ''
    end as notes
  from generated
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

-- Check 1: occupied/reserved must be female or male. Should return 0 rows.
select id, hospital_id, room, bed, status, gender
from public.beds
where status in ('occupied','reserved')
  and gender not in ('female','male');

-- Check 2: free beds in rooms with occupied/reserved beds must match room gender. Should return 0 rows.
select f.hospital_id, f.room, f.id as free_bed_id, f.gender as free_gender, a.gender as assigned_gender
from public.beds f
join public.beds a
  on a.hospital_id = f.hospital_id
 and a.room = f.room
 and a.status in ('occupied','reserved')
where f.status = 'free'
  and f.gender <> a.gender;

-- Check 3: room max 4 beds. Should return 0 rows.
select hospital_id, room, count(*) as bed_count
from public.beds
group by hospital_id, room
having count(*) > 4;

-- Check 4: isolation beds are alone. Should return 0 rows.
select hospital_id, room, count(*) as bed_count
from public.beds
where (hospital_id, room) in (
  select hospital_id, room from public.beds where isolation = true
)
group by hospital_id, room
having count(*) > 1;

-- Overview.
select h.id as hospital_id, h.name, count(b.id) as beds
from public.sasis_hospitals h
left join public.beds b on b.hospital_id = h.id
group by h.id, h.name, h.sort_order
order by h.sort_order, h.name;
