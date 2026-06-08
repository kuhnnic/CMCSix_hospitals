-- CMCSix Hospitals · Geschlecht auf unassigned/female/male begrenzen
-- Im Supabase SQL Editor ausführen.
-- Diese Migration bereinigt bestehende Werte und setzt eine neue Check-Constraint.
-- Erlaubte Werte: unassigned, female, male.

begin;

-- Bestehende ungültige Werte bereinigen.
-- Für Demo-Zwecke werden unbekannte Werte auf unassigned gesetzt.
update public.beds
set gender = 'unassigned'
where gender is null or gender not in ('unassigned','female','male');

-- Alte Constraint entfernen, falls vorhanden.
alter table public.beds
  drop constraint if exists beds_gender_check;

-- Neue Constraint: unassigned/female/male.
alter table public.beds
  alter column gender set default 'unassigned';

alter table public.beds
  add constraint beds_gender_check
  check (gender in ('unassigned','female','male'));

commit;

-- Kontrolle: Sollte 0 Zeilen liefern.
select id, hospital_id, gender
from public.beds
where gender not in ('unassigned','female','male');
