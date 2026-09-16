-- ============================================================
-- BusyNest — keep-alive heartbeat
--
-- Supabase pauses free projects after ~1 week with too little
-- database activity. This adds a tiny table and a function that an
-- automated daily ping can call, which counts as real activity.
--
-- ALREADY INCLUDED in schema.sql — you only need to run this file if
-- you set up BusyNest before the keep-alive existed.
--
-- HOW TO USE:
--   Supabase Dashboard -> SQL Editor -> New query -> paste -> Run
-- ============================================================

-- A single-row table that records the most recent ping.
create table if not exists public.keepalive (
  id         smallint primary key default 1,
  last_ping  timestamptz not null default now(),
  ping_count bigint not null default 0,
  constraint keepalive_single_row check (id = 1)
);

insert into public.keepalive (id) values (1) on conflict (id) do nothing;

-- Locked down: RLS on with no policies, so nothing can read or write
-- this table directly. Only the function below can touch it.
alter table public.keepalive enable row level security;

-- The ping. Runs as the table owner (security definer), so it works
-- with the public anon key — no need to put your secret service_role
-- key into a scheduler.
create or replace function public.ping_keepalive()
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  pinged timestamptz;
begin
  update public.keepalive
     set last_ping  = now(),
         ping_count = ping_count + 1
   where id = 1
  returning last_ping into pinged;
  return pinged;
end;
$$;

grant execute on function public.ping_keepalive() to anon, authenticated;

-- Try it right now — this should return the current time:
--   select public.ping_keepalive();
