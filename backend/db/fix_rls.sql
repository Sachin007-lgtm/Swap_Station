-- OPTION 1: Disable RLS (Easiest for development)
-- Run these commands in your Supabase SQL Editor to allow unrestricted access to these tables.
alter table public.stations disable row level security;
alter table public.signals disable row level security;

-- OPTION 2: Allow Insert/Update for everyone (If you want to keep RLS enabled)
-- create policy "Enable insert for all" on public.stations for insert with check (true);
-- create policy "Enable update for all" on public.stations for update using (true);
-- create policy "Enable insert for all" on public.signals for insert with check (true);
