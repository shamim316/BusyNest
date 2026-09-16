-- ============================================================
-- BusyNest — Supabase database schema
--
-- HOW TO USE:
--   1. Open your Supabase project at https://supabase.com/dashboard
--   2. Go to "SQL Editor" in the left menu
--   3. Paste this entire file and click "Run"
--
-- Safe to re-run: it only creates things that don't exist yet.
-- ============================================================

-- ---------- Tables ----------

create table if not exists public.projects (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  name        text not null default 'Untitled project',
  description text not null default '',
  color       text not null default '#c98a2b',
  is_archived boolean not null default false,
  created_at  timestamptz not null default now()
);

create table if not exists public.tasks (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  project_id   uuid not null references public.projects (id) on delete cascade,
  title        text not null default 'New task',
  notes_html   text not null default '',
  status       text not null default 'todo'
               check (status in ('todo', 'in_progress', 'done')),
  priority     text not null default 'medium'
               check (priority in ('low', 'medium', 'high')),
  start_date   date,
  due_date     date,
  sort_order   double precision not null default extract(epoch from now()) * 1000,
  created_at   timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.task_dependencies (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users (id) on delete cascade,
  task_id             uuid not null references public.tasks (id) on delete cascade,
  depends_on_task_id  uuid not null references public.tasks (id) on delete cascade,
  unique (task_id, depends_on_task_id),
  check (task_id <> depends_on_task_id)
);

create table if not exists public.pages (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  parent_id    uuid references public.pages (id) on delete cascade,
  kind         text not null default 'page' check (kind in ('page', 'journal')),
  title        text not null default '',
  emoji        text not null default '📄',
  content_html text not null default '',
  journal_date date,
  sort_order   double precision not null default extract(epoch from now()) * 1000,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ---------- Indexes ----------

create index if not exists tasks_user_idx on public.tasks (user_id);
create index if not exists tasks_project_idx on public.tasks (project_id);
create index if not exists tasks_due_idx on public.tasks (due_date);
create index if not exists deps_task_idx on public.task_dependencies (task_id);
create index if not exists deps_blocker_idx on public.task_dependencies (depends_on_task_id);
create index if not exists pages_user_idx on public.pages (user_id);
create index if not exists pages_parent_idx on public.pages (parent_id);

-- ---------- Row Level Security ----------
-- Every user only ever sees and edits their OWN rows.

alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.task_dependencies enable row level security;
alter table public.pages enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array['projects', 'tasks', 'task_dependencies', 'pages'] loop
    execute format(
      'drop policy if exists "own rows" on public.%I;
       create policy "own rows" on public.%I
         for all
         using (auth.uid() = user_id)
         with check (auth.uid() = user_id);',
      t, t
    );
  end loop;
end $$;

-- ---------- Realtime ----------
-- Lets the app receive live updates when data changes in another tab/device.

do $$
begin
  execute 'alter publication supabase_realtime add table public.projects';
exception when duplicate_object then null;
end $$;

do $$
begin
  execute 'alter publication supabase_realtime add table public.tasks';
exception when duplicate_object then null;
end $$;

do $$
begin
  execute 'alter publication supabase_realtime add table public.task_dependencies';
exception when duplicate_object then null;
end $$;

do $$
begin
  execute 'alter publication supabase_realtime add table public.pages';
exception when duplicate_object then null;
end $$;

-- Realtime DELETE events need the full old row, which requires replica
-- identity full on each table.

alter table public.projects replica identity full;
alter table public.tasks replica identity full;
alter table public.task_dependencies replica identity full;
alter table public.pages replica identity full;

-- ---------- Keep-alive ----------
-- Supabase pauses free projects after ~1 week with too little database
-- activity. A scheduled ping (see n8n/keep-alive.json) calls the function
-- below once a day, which counts as real activity and keeps the project
-- awake. Nothing in the app itself uses this.

create table if not exists public.keepalive (
  id         smallint primary key default 1,
  last_ping  timestamptz not null default now(),
  ping_count bigint not null default 0,
  constraint keepalive_single_row check (id = 1)
);

insert into public.keepalive (id) values (1) on conflict (id) do nothing;

-- RLS on with no policies: nothing can read or write this table
-- directly. Only the security-definer function below can touch it.
alter table public.keepalive enable row level security;

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
