# 🪺 BusyNest

Your personal project HQ — a self-hosted blend of Jira and Confluence,
designed for one person (or a few) instead of a company.

| Area | What you get |
|---|---|
| **Projects & tasks** | Break projects into small tasks with notes, priorities, start & due dates |
| **Kanban board** | Drag & drop cards between *To do → In progress → Done* |
| **List view** | Sortable table with inline status changes and checkboxes |
| **Timeline (Gantt)** | Calendar timeline with today marker, weekends, and dependency arrows |
| **Dependencies** | Mark tasks as *blocked by* other tasks; blocked cards get a ⛓ badge |
| **Docs** | Nested WYSIWYG pages — knowledge base, status pages, summaries |
| **Journal** | One private page per day for activity tracking and journaling |
| **Real-time** | Changes sync instantly across tabs and devices |
| **Multi-user** | Each account gets a fully private workspace (enforced in the database) |

**Tech:** React web app (static files served by nginx) + [Supabase](https://supabase.com)
(database, login, real-time) + [n8n](https://n8n.io) (reminders & backups).
No custom server code to maintain.

---

## Setup guide (about 30 minutes, no coding needed)

### Part 1 — Create the Supabase backend (~10 min)

1. Go to [supabase.com](https://supabase.com) and create a free account,
   then click **New project**. Pick any name (e.g. `busynest`), a strong
   database password (save it somewhere), and a region near you.
2. When the project is ready, open **SQL Editor** in the left menu, click
   **New query**, paste the entire contents of
   [`supabase/schema.sql`](supabase/schema.sql) from this repo, and click
   **Run**. You should see "Success. No rows returned".
3. Open **Authentication → Sign In / Providers** and make sure **Email** is
   enabled.
   - *Optional but recommended for a personal app:* turn **off**
     "Confirm email" so new accounts work immediately without a
     confirmation email.
4. Open **Project Settings → API** and copy two values for later:
   - **Project URL** (looks like `https://abcdefgh.supabase.co`)
   - **anon / public** key (a long string starting with `eyJ…`)

> The **anon key is safe to expose** in the web app — the database's
> Row Level Security rules (created by the schema file) make sure every
> user can only ever see their own data. The **service_role** key is the
> dangerous one; it is only used inside n8n on your VPS.

### Part 2 — Deploy the app on your VPS with Easypanel (~10 min)

1. In Easypanel, create a new **App** service in a project.
2. Under **Source**, choose **GitHub** and select this repository
   (`shamim316/BusyNest`), branch `main`. Build type: **Dockerfile**.
3. Under **Environment**, add:
   ```
   SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
   SUPABASE_ANON_KEY=eyJ...your anon key...
   ```
4. Under **Domains**, add the domain or subdomain you want
   (e.g. `busynest.yourdomain.com`) — Easypanel gives you free HTTPS.
   The app listens on port **80** inside the container.
5. Click **Deploy**. When the build finishes, open your domain, click
   **Create an account**, and you're in! 🎉

### Part 3 — Try it locally with Docker Desktop (optional)

```
copy .env.example .env      (then edit .env with your Supabase values)
docker compose up --build
```
Open http://localhost:8080 — same app, running on your PC.

### Part 4 — n8n automations (~10 min)

Import the workflows in the [`n8n/`](n8n/) folder into your n8n instance:

- **Keep Supabase awake** — ⚠️ *not optional if you're on the free plan.*
  Supabase pauses free projects after about a week of low activity, which
  takes BusyNest offline until you restore it by hand. This pings your
  database twice a day so that never happens.
- **Daily due-date reminders** — emails you each morning when tasks are due
  or overdue.
- **Nightly backup to VPS** — saves all your data as a dated JSON file on
  your VPS disk every night.

Full instructions in [`n8n/README.md`](n8n/README.md).

A second, independent keep-alive ping is also included as a GitHub Action
([`.github/workflows/keep-alive.yml`](.github/workflows/keep-alive.yml)) so
your project stays awake even if your VPS is down.

---

## Using BusyNest

- **Create a project** with the `+` next to *Projects* in the sidebar. Click
  the colored dot next to a project's name to cycle its color.
- **Add tasks** with the quick-add box; click a card/row to open the full
  task with notes, dates, priority and dependencies.
- **Dependencies:** in a task, pick another task under *"Add a blocked-by
  task"*. Blocked cards show a ⛓ badge on the board, and the Timeline view
  draws arrows between dependent tasks.
- **Timeline:** tasks appear once they have a start and/or due date.
- **Docs:** build nested pages with the `+ Sub-page` button; click a page's
  emoji to change its icon.
- **Journal:** the *Today* button always opens today's entry; browse
  previous days from the list or the Prev/Next buttons.

## Updating the app

When this repository gets new commits, just click **Deploy** again in
Easypanel — it rebuilds from the latest code. Your data lives in Supabase,
so redeploying never touches it.

## Project layout (for the curious)

```
src/                    React app (screens in src/components)
supabase/schema.sql     Database tables + security rules
supabase/keepalive.sql  Heartbeat for the anti-pause ping
n8n/                    Importable automation workflows
.github/workflows/      Backup keep-alive ping on GitHub's servers
Dockerfile              Builds the app and serves it with nginx
docker-compose.yml      Local run with Docker Desktop
```

---

## Troubleshooting

**"Project paused" / the app can't load anything.** Supabase paused your
free project for inactivity. Restore it from the Supabase dashboard, then
set up the keep-alive in Part 4 so it doesn't happen again. Supabase
permanently deletes projects left paused for a long time, so don't leave it
sitting — and keep the nightly backup workflow active.

**Confirmation emails link to `localhost:3000`.** In Supabase, open
**Authentication → URL Configuration**, set **Site URL** to your real
domain and add `https://your-domain.com/**` to **Redirect URLs**. For a
personal app you can also turn off **Confirm email** entirely under
**Authentication → Sign In / Providers → Email**.

**Easypanel says "Branch not found".** Check that the branch name in the
service's Source settings matches a branch that exists in the repository.

**The app shows "Almost there!".** The `SUPABASE_URL` and
`SUPABASE_ANON_KEY` environment variables aren't reaching the container.
Check them in Easypanel and redeploy.

**The keep-alive ping returns "function not found".** You haven't run
[`supabase/keepalive.sql`](supabase/keepalive.sql) in the Supabase SQL
editor yet.
