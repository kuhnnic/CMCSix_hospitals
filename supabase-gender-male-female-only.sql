-- CMCSix Hospitals · Geschlecht auf male/female begrenzen
-- Im Supabase SQL Editor ausführen.
-- Diese Migration bereinigt bestehende Werte und setzt eine neue Check-Constraint.

begin;

-- Bestehende alte Werte bereinigen.
-- Für Demo-Zwecke werden unassigned/diverse auf female gesetzt, damit die neue Constraint greift.
update public.beds
set gender = 'female'
where gender is null or gender not in ('female','male');

-- Alte Constraint entfernen, falls vorhanden.
alter table public.beds
  drop constraint if exists beds_gender_check;

-- Neue Constraint: nur female/male.
alter table public.beds
  alter column gender set default 'female';

alter table public.beds
  add constraint beds_gender_check
  check (gender in ('female','male'));

commit;

-- Kontrolle: Sollte 0 Zeilen liefern.
select id, hospital_id, gender
from public.beds
where gender not in ('female','male');
