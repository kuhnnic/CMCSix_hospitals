-- CMCSix Hospitals · Preflight für supabase-demo-seed-expanded.sql
-- Ausführen, falls Supabase beim Seed meldet:
-- ERROR 42P13: cannot change name of input parameter "p_contact_tel"
--
-- Hintergrund: PostgreSQL erlaubt bei CREATE OR REPLACE FUNCTION keine Umbenennung
-- bestehender Input-Parameter. Deshalb wird die alte RPC-Funktion vor dem Seed sauber entfernt.

drop function if exists public.update_sasis_contact_fields(text, text, text);
