# BusyNest × n8n automations

Two ready-made workflows you can import into your n8n instance.

> **Where do the secret values come from?**
> In your Supabase dashboard, open **Project Settings → API**:
> - `YOUR-PROJECT-REF.supabase.co` → your **Project URL**
> - `YOUR-SERVICE-ROLE-KEY` → the **service_role** key (never put this key
>   in the web app — only in n8n, which runs privately on your VPS)

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
