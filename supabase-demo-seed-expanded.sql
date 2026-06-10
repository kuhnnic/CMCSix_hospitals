-- CMCSix Hospitals · Erweiterte Demo-Seed-Daten
-- Quelle: SASIS_Hospitals.xlsx aus dem Chat + Bettenrichtwerte aus der angehängten Grafik.
-- Zweck: Demo-Datenbestand für Dashboard, Kartenansicht und Spitalbettenverwaltung.
--
-- Wirkung:
--   * löscht bestehende Demo-Daten in public.beds, public.stations und public.sasis_hospitals
--   * legt alle benötigten Tabellen/Spalten an
--   * erzeugt public.sasis_hospitals_api als read-only View für Dashboard/Verwaltung
--   * erzeugt konsistente Stationen und Betten
--
-- Regeln:
--   * SASIS-Stammdaten werden im Seed neu geladen; Kontaktfelder bleiben als Ergänzungsfelder separat.
--   * Belegte und reservierte Betten haben immer Geschlecht female/male.
--   * Isolationsbetten liegen allein im Zimmer.
--   * Pro Spital sind mindestens 70% aller Betten status = occupied.
--   * Alle gültigen Kombinationen aus Eigenschaften, Geschlecht und Status sind im Datenbestand abgedeckt.
--     Ungültige App-Kombinationen wie occupied/reserved + unassigned werden bewusst nicht erzeugt.
--
-- Ausführen im Supabase SQL Editor.

begin;

create table if not exists public.sasis_hospitals (
  id text primary key,
  name text not null,
  street text not null default '',
  place text not null default '',
  validity_area text not null default '',
  partner_group text not null default '',
  partner_subgroup text not null default '',
  zsr text not null default '',
  gln text not null default '',
  specialties text[] not null default '{}',
  sort_order integer not null default 0,
  contact_tel text not null default '',
  remarks text not null default '',
  lat double precision,
  lng double precision,
  updated_at timestamptz not null default now()
);

alter table public.sasis_hospitals
  add column if not exists gln text not null default '',
  add column if not exists contact_tel text not null default '',
  add column if not exists remarks text not null default '',
  add column if not exists lat double precision,
  add column if not exists lng double precision;

create table if not exists public.stations (
  id text primary key,
  hospital_id text not null references public.sasis_hospitals(id) on update cascade on delete cascade,
  name text not null,
  code text not null default '',
  floor text not null default '',
  specialty text not null default '',
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.beds (
  id text primary key,
  hospital_id text not null references public.sasis_hospitals(id) on update cascade on delete restrict,
  station_id text references public.stations(id) on update cascade on delete set null,
  specialty text not null,
  station text not null default '',
  room text not null default '',
  bed text not null default 'A',
  type text not null default 'Standardbett',
  care text not null default 'Normalpflege',
  isolation boolean not null default false,
  oxygen boolean not null default false,
  monitoring boolean not null default false,
  accessible boolean not null default false,
  gender text not null default 'unassigned' check (gender in ('unassigned','female','male')),
  status text not null default 'free' check (status in ('free','reserved','occupied','cleaning','blocked')),
  notes text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.beds
  add column if not exists station_id text,
  add column if not exists gender text not null default 'unassigned',
  add column if not exists monitoring boolean not null default false,
  add column if not exists oxygen boolean not null default false,
  add column if not exists isolation boolean not null default false,
  add column if not exists accessible boolean not null default false,
  add column if not exists notes text not null default '';

do $$
begin
  alter table public.beds drop constraint if exists beds_gender_check;
  alter table public.beds add constraint beds_gender_check check (gender in ('unassigned','female','male'));

  alter table public.beds drop constraint if exists beds_status_check;
  alter table public.beds add constraint beds_status_check check (status in ('free','reserved','occupied','cleaning','blocked'));
end $$;

do $$
declare
  rel_kind char;
begin
  select c.relkind into rel_kind
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname = 'sasis_hospitals_api';

  if rel_kind is not null then
    execute case
      when rel_kind = 'v' then 'drop view if exists public.sasis_hospitals_api cascade'
      when rel_kind = 'm' then 'drop materialized view if exists public.sasis_hospitals_api cascade'
      else 'drop table if exists public.sasis_hospitals_api cascade'
    end;
  end if;
end $$;

delete from public.beds;
delete from public.stations;
delete from public.sasis_hospitals;

create temporary table demo_hospital_seed (
  id text primary key,
  name text not null,
  street text not null,
  place text not null,
  validity_area text not null,
  partner_group text not null,
  partner_subgroup text not null,
  zsr text not null,
  gln text not null,
  specialties text[] not null,
  sort_order integer not null,
  lat double precision,
  lng double precision,
  standard_beds integer not null,
  ips_beds integer not null
) on commit drop;

insert into demo_hospital_seed (
  id, name, street, place, validity_area, partner_group, partner_subgroup, zsr, gln,
  specialties, sort_order, lat, lng, standard_beds, ips_beds
) values
('luks-luzern', 'LUKS Spitalbetriebe AG', 'Kantonsspital 37', '6004 Luzern', 'Luzern', 'Spitäler', 'Zentrumsversorgung, Niveau 2', 'X067503', '7601002126694', array['Innere Medizin','Chirurgie','Notfall','Intensivpflege','Geburtshilfe','Pädiatrie','Orthopädie','Kardiologie'], 10, 47.057300, 8.298400, 835, 43),
('luks-sursee', 'LUKS Spitalbetriebe AG', 'Spitalstrasse 16A', '6210 Sursee', 'Luzern', 'Spitäler', 'Zentrumsversorgung, Niveau 2', 'A626203', '7601002003056', array['Innere Medizin','Chirurgie','Notfall','Intensivpflege','Geburtshilfe','Pädiatrie','Orthopädie','Kardiologie'], 20, 47.174300, 8.111700, 160, 6),
('luks-wolhusen', 'LUKS Spitalbetriebe AG', 'Spitalstrasse 50', '6110 Wolhusen', 'Luzern', 'Spitäler', 'Zentrumsversorgung, Niveau 2', 'A623603', '7601002003070', array['Innere Medizin','Chirurgie','Notfall','Intensivpflege','Geburtshilfe','Pädiatrie','Orthopädie','Kardiologie'], 30, 47.059500, 8.073800, 120, 4),
('luks-ks37', 'LUKS Spitalbetriebe AG', 'Kantonsspital 37', '6004 Luzern', 'Luzern', 'Spitäler', 'Zentrumsversorgung, Niveau 2', 'A621003', '7601009329302', array['Innere Medizin','Chirurgie','Notfall','Intensivpflege','Geburtshilfe','Pädiatrie','Orthopädie','Kardiologie'], 40, 47.057300, 8.298400, 80, 4),
('st-anna', 'Klinik St. Anna', 'St. Anna-Strasse 32', '6006 Luzern', 'Luzern', 'Spitäler', 'Zentrumsversorgung, Niveau 2', 'O709403', '7601002002967', array['Innere Medizin','Chirurgie','Notfall','Intensivpflege','Geburtshilfe','Pädiatrie','Orthopädie','Kardiologie'], 50, 47.060500, 8.337600, 106, 8),
('sonnmatt', 'Zurzach Care Rehaklinik Sonnmatt Luzern', 'Sonnmatt 1', '6006 Luzern', 'Luzern', 'Spitäler', 'Rehabilitationskliniken', 'J167703', '7601002521871', array['Rehabilitation','Geriatrische Reha','Neurologische Reha','Orthopädische Reha'], 60, 47.061100, 8.342800, 90, 0),
('ks-aarau', 'Kantonsspital Aarau AG', 'Tellstrasse', '5001 Aarau', 'Aargau', 'Spitäler', 'Zentrumsversorgung, Niveau 2', 'M700419', '7601002001137', array['Innere Medizin','Chirurgie','Notfall','Intensivpflege','Geburtshilfe','Pädiatrie','Orthopädie','Kardiologie'], 70, 47.390700, 8.047000, 489, 28),
('ks-obwalden', 'Kantonsspital Obwalden', 'Brünigstrasse 181', '6060 Sarnen', 'Obwalden', 'Spitäler', 'Grundversorgung, Niveau 3', 'B708006', '7601002000222', array['Innere Medizin','Chirurgie','Notfall','Geriatrie'], 80, 46.898100, 8.248400, 66, 0),
('lups-sarnen', 'Luzerner Psychiatrie AG', 'Brünigstrasse 183', '6060 Sarnen', 'Obwalden', 'Spitäler', 'Psychiatrische Kliniken, Niveau 1', 'K012606', '7601002523707', array['Akutpsychiatrie','Alterspsychiatrie','Kinder-/Jugendpsychiatrie','Krisenintervention'], 90, 46.898000, 8.249000, 100, 0),
('spital-nidwalden', 'Spital Nidwalden', 'Ennetmooserstrasse 19', '6370 Stans', 'Nidwalden', 'Spitäler', 'Grundversorgung, Niveau 4', 'G709007', '7601002003179', array['Innere Medizin','Chirurgie','Notfall','Geriatrie','Intensivpflege'], 100, 46.958400, 8.369300, 100, 4),
('forensik', 'Forensische Psychiatrie', 'Seeblickstrasse 3', '8596 Münsterlingen', 'Thurgau', 'Spitäler', 'Psychiatrische Kliniken, Niveau 1', 'I551820', '7601002023153', array['Akutpsychiatrie','Alterspsychiatrie','Kinder-/Jugendpsychiatrie','Krisenintervention'], 110, 47.631500, 9.232400, 40, 0),
('kjpd', 'Kinder- und Jugendpsychiatrischer Dienst - KJPD', 'Seeblickstrasse 3', '8596 Münsterlingen', 'Thurgau', 'Spitäler', 'Psychiatrische Kliniken, Niveau 1', 'N777320', '7601002023153', array['Akutpsychiatrie','Alterspsychiatrie','Kinder-/Jugendpsychiatrie','Krisenintervention'], 120, 47.631500, 9.232400, 30, 0),
('ksk', 'Klinik St. Katharinental (KSK)', 'St. Katharinental 7', '8253 Diessenhofen', 'Thurgau', 'Spitäler', 'Rehabilitationskliniken', 'A703720', '7601002003667', array['Rehabilitation','Geriatrische Reha','Neurologische Reha','Orthopädische Reha'], 130, 47.690000, 8.756000, 60, 0),
('pk-muensterlingen', 'Psychiatrische Klinik Münsterlingen', 'Seeblickstrasse 3', '8596 Münsterlingen', 'Thurgau', 'Spitäler', 'Psychiatrische Kliniken, Niveau 1', 'A714420', '7601002023153', array['Akutpsychiatrie','Alterspsychiatrie','Kinder-/Jugendpsychiatrie','Krisenintervention'], 140, 47.631500, 9.232400, 150, 0),
('stg-frauenfeld', 'Spital Thurgau AG', 'Pfaffenholzstrasse 4', '8500 Frauenfeld', 'Thurgau', 'Spitäler', 'Zentrumsversorgung, Niveau 2', 'P706820', '7601002000185', array['Innere Medizin','Chirurgie','Notfall','Intensivpflege','Geburtshilfe','Pädiatrie','Orthopädie','Kardiologie'], 150, 47.557500, 8.899200, 250, 12),
('stg-muensterlingen', 'Spital Thurgau AG', 'Spitalcampus 1', '8596 Münsterlingen', 'Thurgau', 'Spitäler', 'Zentrumsversorgung, Niveau 2', 'X714320', '7601002000543', array['Innere Medizin','Chirurgie','Notfall','Intensivpflege','Geburtshilfe','Pädiatrie','Orthopädie','Kardiologie'], 160, 47.631500, 9.232400, 300, 16),
('zuger-kantonsspital', 'Zuger Kantonsspital AG', 'Landhausstrasse 11', '6340 Baar', 'Zug', 'Spitäler', 'Zentrumsversorgung, Niveau 2', 'L725309', '7601002004602', array['Innere Medizin','Chirurgie','Notfall','Intensivpflege','Geburtshilfe','Pädiatrie','Orthopädie','Kardiologie'], 170, 47.193100, 8.526900, 176, 8),
('klinik-sgm-langenthal', 'Klinik SGM Langenthal', 'Weissensteinstrasse 30', '4900 Langenthal', 'Bern', 'Spitäler', 'Psychiatrische Kliniken, Niveau 2', 'G735202', '7601002080941', array['Akutpsychiatrie','Alterspsychiatrie','Kinder-/Jugendpsychiatrie','Krisenintervention','Intensivpflege'], 180, 47.213600, 7.789200, 126, 6),
('spital-zofingen', 'Spital Zofingen AG', 'Mühlethalstrasse 27', '4800 Zofingen', 'Aargau', 'Spitäler', 'Grundversorgung, Niveau 4', 'B775819', '7601002001410', array['Innere Medizin','Chirurgie','Notfall','Geriatrie'], 190, 47.288100, 7.945200, 90, 0),
('spital-schwyz', 'Spital Schwyz', 'Waldeggstrasse 10', '6430 Schwyz', 'Schwyz', 'Spitäler', 'Grundversorgung, Niveau 3', 'B717005', '7601002000505', array['Innere Medizin','Chirurgie','Notfall','Geriatrie','Intensivpflege'], 200, 47.020300, 8.657200, 87, 6),
('ks-uri', 'Kantonsspital Uri', 'Spitalstrasse 1', '6460 Altdorf UR', 'Uri', 'Spitäler', 'Grundversorgung, Niveau 4', 'D701204', '7601002004039', array['Innere Medizin','Chirurgie','Notfall','Geriatrie','Intensivpflege'], 210, 46.881200, 8.638600, 74, 6);

insert into public.sasis_hospitals (
  id, name, street, place, validity_area, partner_group, partner_subgroup, zsr, gln,
  specialties, sort_order, lat, lng, contact_tel, remarks, updated_at
)
select
  id, name, street, place, validity_area, partner_group, partner_subgroup, zsr, gln,
  specialties, sort_order, lat, lng, '', '', now()
from demo_hospital_seed
order by sort_order;

insert into public.stations (
  id, hospital_id, name, code, floor, specialty, sort_order, updated_at
)
select
  h.id || '-station-' || lpad(s.ord::text, 2, '0') as id,
  h.id as hospital_id,
  s.specialty as name,
  upper(left(regexp_replace(s.specialty, '[^[:alnum:]]+', '', 'g'), 4)) || '-' || lpad(s.ord::text, 2, '0') as code,
  case ((s.ord - 1) % 5)
    when 0 then 'EG'
    when 1 then '1. OG'
    when 2 then '2. OG'
    when 3 then '3. OG'
    else '4. OG'
  end as floor,
  s.specialty,
  s.ord * 10 as sort_order,
  now()
from demo_hospital_seed h
cross join lateral unnest(h.specialties) with ordinality as s(specialty, ord)
order by h.sort_order, s.ord;

create or replace function pg_temp.cmcsix_valid_status_gender(p_idx integer)
returns table(status text, gender text)
language plpgsql
as $$
declare
  k integer := ((p_idx - 1) % 13);
begin
  case k
    when 0 then status := 'free';     gender := 'unassigned';
    when 1 then status := 'free';     gender := 'female';
    when 2 then status := 'free';     gender := 'male';
    when 3 then status := 'reserved'; gender := 'female';
    when 4 then status := 'reserved'; gender := 'male';
    when 5 then status := 'occupied'; gender := 'female';
    when 6 then status := 'occupied'; gender := 'male';
    when 7 then status := 'cleaning'; gender := 'unassigned';
    when 8 then status := 'cleaning'; gender := 'female';
    when 9 then status := 'cleaning'; gender := 'male';
    when 10 then status := 'blocked'; gender := 'unassigned';
    when 11 then status := 'blocked'; gender := 'female';
    else status := 'blocked';         gender := 'male';
  end case;
  return next;
end $$;

create or replace function pg_temp.cmcsix_seed_beds(
  p_hospital_id text,
  p_standard_beds integer,
  p_ips_beds integer
)
returns void
language plpgsql
as $$
declare
  total_beds integer := p_standard_beds + p_ips_beds;
  occupied_target integer := ceiling((p_standard_beds + p_ips_beds) * 0.72);
  reserved_target integer := greatest(1, floor((p_standard_beds + p_ips_beds) * 0.05));
  cleaning_target integer := greatest(1, floor((p_standard_beds + p_ips_beds) * 0.03));
  blocked_target integer := greatest(1, floor((p_standard_beds + p_ips_beds) * 0.03));
  coverage_count integer := case when p_hospital_id = 'luks-luzern' then 208 else 0 end;
  coverage_occupied integer := 32;
  extra_occupied_needed integer := greatest(0, occupied_target - case when p_hospital_id = 'luks-luzern' then coverage_occupied else 0 end);
  specialty_list text[];
  specialty_count integer;
  station_specialty text;
  station_id text;
  i integer;
  feature_idx integer;
  sg record;
  v_status text;
  v_gender text;
  v_is_ips boolean;
  v_oxygen boolean;
  v_monitoring boolean;
  v_isolation boolean;
  v_accessible boolean;
  v_type text;
  v_care text;
begin
  select specialties into specialty_list from public.sasis_hospitals where id = p_hospital_id;
  specialty_count := greatest(1, coalesce(array_length(specialty_list, 1), 1));

  for i in 1..total_beds loop
    v_is_ips := i > p_standard_beds;

    if i <= coverage_count then
      select * into sg from pg_temp.cmcsix_valid_status_gender(i);
      v_status := sg.status;
      v_gender := sg.gender;
      feature_idx := (i - 1) % 16;
    else
      if i <= coverage_count + extra_occupied_needed then
        v_status := 'occupied';
        v_gender := case when i % 2 = 0 then 'female' else 'male' end;
      elsif i <= coverage_count + extra_occupied_needed + reserved_target then
        v_status := 'reserved';
        v_gender := case when i % 2 = 0 then 'female' else 'male' end;
      elsif i <= coverage_count + extra_occupied_needed + reserved_target + cleaning_target then
        v_status := 'cleaning';
        v_gender := case i % 3 when 0 then 'unassigned' when 1 then 'female' else 'male' end;
      elsif i <= coverage_count + extra_occupied_needed + reserved_target + cleaning_target + blocked_target then
        v_status := 'blocked';
        v_gender := case i % 3 when 0 then 'unassigned' when 1 then 'female' else 'male' end;
      else
        v_status := 'free';
        v_gender := case i % 3 when 0 then 'unassigned' when 1 then 'female' else 'male' end;
      end if;
      feature_idx := (i - 1) % 16;
    end if;

    v_oxygen := (feature_idx & 1) <> 0;
    v_monitoring := (feature_idx & 2) <> 0;
    v_isolation := (feature_idx & 4) <> 0;
    v_accessible := (feature_idx & 8) <> 0;

    if v_is_ips then
      station_specialty := 'Intensivpflege';
      v_care := 'Intensivpflege';
      v_monitoring := true;
    else
      station_specialty := specialty_list[((i - 1) % specialty_count) + 1];
      v_care := case when station_specialty in ('Intensivpflege','Notfall') then 'Akutpflege' else 'Normalpflege' end;
    end if;

    select id into station_id
    from public.stations
    where hospital_id = p_hospital_id
      and specialty = station_specialty
    order by sort_order
    limit 1;

    if station_id is null then
      station_id := p_hospital_id || '-station-extra-ips';
      insert into public.stations (id, hospital_id, name, code, floor, specialty, sort_order, updated_at)
      values (station_id, p_hospital_id, station_specialty, 'IPS', '2. OG', station_specialty, 990, now())
      on conflict (id) do nothing;
    end if;

    v_type := case
      when v_isolation then 'Isolationsbett'
      when v_monitoring then 'Überwachungsbett'
      when v_accessible then 'Barrierefreies Bett'
      else 'Standardbett'
    end;

    insert into public.beds (
      id, hospital_id, station_id, specialty, station, room, bed, type, care,
      isolation, oxygen, monitoring, accessible, gender, status, notes, updated_at
    ) values (
      p_hospital_id || '-bed-' || lpad(i::text, 4, '0'),
      p_hospital_id,
      station_id,
      station_specialty,
      station_specialty,
      'Z' || lpad(i::text, 4, '0'),
      'A',
      v_type,
      v_care,
      v_isolation,
      v_oxygen,
      v_monitoring,
      v_accessible,
      v_gender,
      v_status,
      case
        when i <= coverage_count then 'Demo-Coverage: gültige Kombination aus Status, Geschlecht und Bettentyp.'
        when v_is_ips then 'Demo-IPS-Bett gemäss Richtwert.'
        else 'Demo-Standardbett gemäss Richtwert.'
      end,
      now() - ((total_beds - i) || ' minutes')::interval
    );
  end loop;
end $$;

select pg_temp.cmcsix_seed_beds(id, standard_beds, ips_beds)
from demo_hospital_seed
order by sort_order;

create index if not exists sasis_hospitals_validity_area_idx on public.sasis_hospitals (validity_area);
create index if not exists sasis_hospitals_partner_subgroup_idx on public.sasis_hospitals (partner_subgroup);
create index if not exists beds_hospital_id_idx on public.beds (hospital_id);
create index if not exists beds_status_idx on public.beds (status);
create index if not exists beds_specialty_idx on public.beds (specialty);
create index if not exists beds_room_gender_idx on public.beds (hospital_id, specialty, room, gender);
create index if not exists beds_station_id_idx on public.beds (station_id);
create index if not exists stations_hospital_id_idx on public.stations (hospital_id);

create or replace view public.sasis_hospitals_api as
select
  id,
  name,
  street,
  place,
  validity_area,
  partner_group,
  partner_subgroup,
  zsr,
  gln,
  specialties,
  sort_order,
  contact_tel,
  remarks,
  lat,
  lng,
  updated_at
from public.sasis_hospitals;

alter table public.sasis_hospitals enable row level security;
alter table public.stations enable row level security;
alter table public.beds enable row level security;

drop policy if exists "Allow public hospital read" on public.sasis_hospitals;
create policy "Allow public hospital read"
on public.sasis_hospitals for select
to anon
using (true);

drop policy if exists "Allow public hospital update contact fields" on public.sasis_hospitals;
create policy "Allow public hospital update contact fields"
on public.sasis_hospitals for update
to anon
using (true)
with check (true);

drop policy if exists "Allow public station read" on public.stations;
create policy "Allow public station read"
on public.stations for select
to anon
using (true);

drop policy if exists "Allow public bed read" on public.beds;
create policy "Allow public bed read"
on public.beds for select
to anon
using (true);

drop policy if exists "Allow public bed insert" on public.beds;
create policy "Allow public bed insert"
on public.beds for insert
to anon
with check (true);

drop policy if exists "Allow public bed update" on public.beds;
create policy "Allow public bed update"
on public.beds for update
to anon
using (true)
with check (true);

create or replace function public.update_sasis_contact_fields(
  p_id text,
  p_contact_tel text,
  p_remarks text
)
returns table(id text, contact_tel text, remarks text)
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.sasis_hospitals h
  set
    contact_tel = coalesce(p_contact_tel, ''),
    remarks = coalesce(p_remarks, ''),
    updated_at = now()
  where h.id = p_id;

  return query
  select h.id, h.contact_tel, h.remarks
  from public.sasis_hospitals h
  where h.id = p_id;
end;
$$;

grant select on public.sasis_hospitals_api to anon;
grant select on public.sasis_hospitals to anon;
grant select on public.stations to anon;
grant select, insert, update on public.beds to anon;
grant execute on function public.update_sasis_contact_fields(text, text, text) to anon;

commit;

-- Kontrollabfragen
select
  h.id,
  h.name,
  h.place,
  count(b.id) as betten_total,
  count(*) filter (where b.status = 'occupied') as belegt,
  round(100.0 * count(*) filter (where b.status = 'occupied') / count(b.id), 1) as belegung_prozent,
  count(*) filter (where b.status = 'free') as frei
from public.sasis_hospitals h
join public.beds b on b.hospital_id = h.id
group by h.id, h.name, h.place, h.sort_order
order by h.sort_order;

select
  status,
  gender,
  oxygen,
  monitoring,
  isolation,
  accessible,
  count(*) as anzahl
from public.beds
group by status, gender, oxygen, monitoring, isolation, accessible
order by status, gender, oxygen, monitoring, isolation, accessible;
