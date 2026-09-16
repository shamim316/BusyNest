# BusyNest × n8n automations

Three ready-made workflows you can import into your n8n instance.

> **Where do the secret values come from?**
> In your Supabase dashboard, open **Project Settings → API**:
> - `YOUR-PROJECT-REF.supabase.co` → your **Project URL**
> - `YOUR-ANON-KEY` → the **anon / public** key (safe to use anywhere)
> - `YOUR-SERVICE-ROLE-KEY` → the **service_role** key (never put this key
>   in the web app — only in n8n, which runs privately on your VPS)

## 0. Keep Supabase awake (`keep-alive.json`) — **set this one up first**

Supabase pauses free projects after about a week of low database activity,
which takes BusyNest offline until you restore it by hand. This workflow
pings your database twice a day so that never happens, and emails you if a
ping ever fails.

**Setup:**
1. In the Supabase **SQL Editor**, run
   [`../supabase/keepalive.sql`](../supabase/keepalive.sql). (If you set up
   BusyNest from `schema.sql` after this was added, it's already there —
   running it again is harmless.)
2. Import `keep-alive.json` into n8n.
3. In the **Ping the database** node, replace the project ref in the URL and
   both `YOUR-ANON-KEY` header values. The anon key is enough here — your
   service_role key is deliberately not used.
4. In the **Alert me it failed** node, set your own from/to addresses and
   SMTP credentials.
5. Click **Execute workflow** once to test it. You should get a green run
   and a timestamp back. Then toggle the workflow **Active**.

**To confirm it's working**, run this in the Supabase SQL editor — the
count goes up with every ping:
```sql
select * from public.keepalive;
```

> There is also a backup ping in
> [`../.github/workflows/keep-alive.yml`](../.github/workflows/keep-alive.yml)
> that runs on GitHub's servers, so your project stays awake even if your
> VPS or n8n goes down. Setup instructions are in the top of that file.

## 1. Daily due-date reminders (`due-date-reminders.json`)

Every morning at 7:00, checks for tasks that are due today or overdue and
emails you a summary.

**Setup after importing:**
1. Open the **Get due & overdue tasks** node and replace the URL's project ref
   and both header values with your own.
2. Open the **Send reminder email** node, set your own from/to addresses and
   attach your SMTP credentials (or swap the node for Telegram, Discord,
   WhatsApp — anything n8n supports).
3. Toggle the workflow **Active**.

## 2. Nightly backup to your VPS (`nightly-backup.json`)

Every night at 2:30, downloads all four BusyNest tables and saves them as a
dated JSON file (e.g. `busynest-2026-07-09.json`) on your VPS disk.

**Setup after importing:**
1. Replace the project ref + service key in all four **Fetch …** nodes.
2. In the **Save to VPS disk** node, adjust the folder if you like. The
   default is `/backups` **inside the n8n container** — map it to a real
   folder on your VPS. In Easypanel, add a *Mount* to the n8n service:
   host path `/root/busynest-backups` → container path `/backups`.
3. Toggle the workflow **Active**.

**Restoring a backup:** each file contains plain JSON of all your data. If
you ever need to restore, you can re-insert it with the Supabase SQL editor
or ask an AI assistant to generate the insert statements from the file.

## Ideas for more automations

- Weekly status summary email (like a Confluence status page, but automatic)
- Create a task in BusyNest when you receive an email with a certain label
- Post today's journal prompt to your phone every evening
- Sync tasks with a calendar via the Google Calendar node
