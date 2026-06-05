-- CMCSix Hospitals · SASIS-Stammdaten als Supabase-Tabelle
-- Im Supabase SQL Editor ausführen.
-- Die App liest danach die Spitäler aus public.sasis_hospitals statt fix aus dem JavaScript.

create table if not exists public.sasis_hospitals (
  id text primary key,
  name text not null,
  street text not null default '',
  place text not null default '',
  validity_area text not null default '',
  partner_group text not null default '',
  partner_subgroup text not null default '',
  zsr text not null default '',
  specialties text[] not null default '{}',
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);

create index if not exists sasis_hospitals_validity_area_idx on public.sasis_hospitals (validity_area);
create index if not exists sasis_hospitals_partner_subgroup_idx on public.sasis_hospitals (partner_subgroup);

alter table public.sasis_hospitals enable row level security;

drop policy if exists "Allow public hospital read" on public.sasis_hospitals;
create policy "Allow public hospital read"
on public.sasis_hospitals for select
to anon
using (true);

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
('stg-muensterlingen','Spital Thurgau AG','Spitalcampus 1','8596 Münsterlingen','Thurgau','Spitäler','Zentrumsversorgung, Niveau 2','X714320',array['Innere Medizin','Chirurgie','Notfall','Intensivpflege','Geburtshilfe','Pädiatrie','Orthopädie','Kardiologie'],160)
on conflict (id) do update set
  name = excluded.name,
  street = excluded.street,
  place = excluded.place,
  validity_area = excluded.validity_area,
  partner_group = excluded.partner_group,
  partner_subgroup = excluded.partner_subgroup,
  zsr = excluded.zsr,
  specialties = excluded.specialties,
  sort_order = excluded.sort_order,
  updated_at = now();

select id, name, validity_area, partner_subgroup, zsr
from public.sasis_hospitals
order by sort_order, name;
