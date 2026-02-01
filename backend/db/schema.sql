-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Stations Table
-- Stores static or semi-static information about each swap station.
create table if not exists public.stations (
  id uuid default uuid_generate_v4() primary key,
  station_id text unique not null,
  name text not null,
  location text,
  city text,
  status text check (status in ('normal', 'warning', 'critical')) default 'normal',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Signals Table
-- Stores raw high-frequency signals/telemetry from stations.
-- This data is typically voluminous.
create table if not exists public.signals (
  id uuid default uuid_generate_v4() primary key,
  station_id text not null references public.stations(station_id),
  type text not null, -- 'battery_level', 'swap_event', 'error'
  value jsonb not null, -- Store flexible payload (e.g., { "charged": 5, "swaps": 1 })
  timestamp timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Decisions Table
-- Stores AI or Rule-based decisions made by the system.
create table if not exists public.decisions (
  id uuid default uuid_generate_v4() primary key,
  station_id text not null references public.stations(station_id),
  action text not null,
  reason text,
  confidence numeric,
  priority text check (priority in ('low', 'medium', 'high')),
  status text default 'pending', -- 'pending', 'executed', 'failed'
  model_used text, -- e.g., 'llama3-70b-8192', 'rule-based'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  metadata jsonb -- Store extra info like 'triggers', 'impact_analysis'
);

-- Metrics Snapshots Table
-- Aggregated metrics over time (e.g., every minute or hour) for analytics.
create table if not exists public.metrics_snapshots (
  id uuid default uuid_generate_v4() primary key,
  station_id text not null references public.stations(station_id),
  swap_rate numeric,
  queue_length numeric,
  charged_batteries integer,
  uptime_percentage numeric,
  timestamp timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Support Ticket / Reroutes Log (Optional but useful)
create table if not exists public.reroute_logs (
    id uuid default uuid_generate_v4() primary key,
    original_station_id text not null,
    target_station_id text,
    driver_id text, -- or phone number hash
    reason text,
    status text default 'sent',
    timestamp timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies (Row Level Security) - Optional specifically for a Hackathon demo, 
-- but good practice. For now, we assume service_role key bypasses this, 
-- or we can enable public read if needed for the dashboard.
alter table public.stations enable row level security;
alter table public.signals enable row level security;
alter table public.decisions enable row level security;
alter table public.metrics_snapshots enable row level security;

-- Policy: Allow read access to everyone (public dashboard)
create policy "Allow public read access" on public.stations for select using (true);
create policy "Allow public read access" on public.decisions for select using (true);
create policy "Allow public read access" on public.metrics_snapshots for select using (true);
