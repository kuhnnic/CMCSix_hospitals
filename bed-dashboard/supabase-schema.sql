-- Optional table for the separate CMCSix dashboard app.
-- SASIS master data is not overwritten; only dashboard-specific supplements are stored here.

create table if not exists public.hospital_profiles (
  hospital_id text primary key,
  zsr text not null,
  gln text not null,
  contact_info text default '',
  remarks text default '',
  updated_at timestamptz default now()
);

alter table public.hospital_profiles enable row level security;

-- Demo policy. Tighten this for production roles/SSO.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'hospital_profiles'
      and policyname = 'demo read hospital profiles'
  ) then
    create policy "demo read hospital profiles"
      on public.hospital_profiles for select
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'hospital_profiles'
      and policyname = 'demo upsert hospital profiles'
  ) then
    create policy "demo upsert hospital profiles"
      on public.hospital_profiles for all
      using (true)
      with check (true);
  end if;
end $$;
