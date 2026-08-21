# Inherent OS

The CRM and operating system for **Inherent Global** — one place for who we
sell to, what we owe each brand, and where every asset actually lives.

It is built around a single idea: **the brand is the spine**. Every deal, task,
content piece, asset and guideline hangs off one brand, so opening NAO shows
its pipeline, its calendar, its pendientes and its asset store together instead
of scattered across six tools.

---

## Running it

The app runs on Postgres. The quickest local database is the one in the compose
file:

```bash
npm install
cp .env.example .env          # then set DATABASE_URL / DIRECT_URL
docker compose up -d db       # or point at any Postgres you already have
npm run setup                 # migrate + seed
npm run dev                   # http://localhost:3000
```

For a plain local Postgres, `DATABASE_URL` and `DIRECT_URL` are the same value.
They only differ when a pooler sits in front of the database — see below.

`npm run setup` is safe to re-run: migrations are versioned and the seed is
idempotent.

### Signing in

Two accounts are created by the seed:

| Person | Email | Role |
| --- | --- | --- |
| Rodrigo Medina | `rodrigomedina@inherentglobal.com` | Owner (CEO) |
| Pablo Rodriguez | `pablorodriguez@inherentglobal.com` | Admin |

Both start with the password in `SEED_PASSWORD` (default `Inherent2026!`).
**Change them from Settings after the first sign-in.**

### The two connection strings

Supabase gives you two, and Prisma needs both. This trips people up because
getting it wrong fails in the least helpful way — the app works fine and
migrations hang forever.

| Variable | Port | Used by | Why |
| --- | --- | --- | --- |
| `DATABASE_URL` | 6543 | the app | Serverless functions open and drop connections constantly; the pooler absorbs that. Keep `?pgbouncer=true&connection_limit=1`. |
| `DIRECT_URL` | 5432 | migrations | DDL and advisory locks do not survive transaction-mode pooling. |

## The domain lock

Only `@inherentglobal.com` addresses can hold an account. The rule lives in one
place — `src/lib/policy.ts` — and every path that can create a user or a
session calls into it:

- **Sign-in** rejects a non-company domain before it touches the database.
- **Invites** (Team → Add someone) re-check server-side; the HTML `pattern` on
  the form is only a courtesy hint.
- **The seed itself** refuses to create a user the login policy would reject.

There is no back door that produces an account the front door would turn away.
Change `ALLOWED_EMAIL_DOMAIN` in `.env` if the company domain ever changes.

---

## What is in it

### Revenue
- **Brands** — every client, its retainer, its owner, and deep links to the
  places its work lives (GitHub repo, Drive folder, Jockey workspace, Figma).
- **Pipeline** — deals by stage with a weighted forecast (value × probability)
  and a win rate that only counts genuinely closed deals.
- **Contacts** — the people at each brand.

### Production
- **Pendientes** — the board. Filter by brand, owner, or overdue. This is where
  the outstanding work for NAO and Akai already lives.
- **Content** — idea → brief → generating → review → approved → scheduled →
  published.
- **Calendar** — a real month grid, filterable per brand (the *calendario por
  marca*), with an agenda strip underneath.
- **Assets** — every file with its stage (raw → generated → approved → final)
  and which system it physically lives in.

### System
- **Connections** — every tool in the chain and whether its pipe is actually
  carrying anything. Credential state is read **live from the server
  environment**; no secret is ever stored in the database or sent to the
  browser.
- **Team** — access, roles, and inviting new people under the domain lock.
- **Settings** — policy, your password, brand tokens, workspace counts.

---

## The content system

The nine checkpoints in `src/lib/pipeline-blueprint.ts` are the PENDIENTES list
turned into a machine. Every brand gets the same chain, so *"where is Akai
stuck?"* is a glance rather than a chat thread:

```
guidelines → drive→jockey → brand calendar → jockey→higgsfield →
approved/generated → final assets → zapier→github → design handoff → scheduled
```

Each hop names the tool that owns it, so a broken pipe on **Connections** and a
stalled brand on its workspace page point at the same place. A new brand is
created with all nine checkpoints and the full guideline checklist already in
place — onboarding is never a blank page.

---

## Brand

`src/lib/brand.ts` is the single source of truth for the look. The values in it
are the **real brand**, taken from the official brand sheet (LOGO VERSIONS,
Group 58):

| Swatch | Hex | Used as |
| --- | --- | --- |
| Charcoal | `#232323` | the dark ground, and raised surfaces |
| Cream | `#E3DDD1` | body text on dark, and the light surface |
| Deep olive | `#372905` | the darkest brand tone; accent hover in light mode |
| Muted olive | `#60563E` | the accent in light mode |
| Paper grey | `#D9D9D9` | the sheet's own neutral |

Dark mode is the brand's home — the sheet leads with cream on charcoal — and
light mode is the cream side of the same system. The accent on dark is a
lightened member of the olive family (`#BFB18A`) so it stays legible on
charcoal; status colours are warmed to sit with the earthy palette while
staying distinguishable at chip size.

The logo is the **real vector artwork**, extracted from the brand sheet into
`src/components/ui/brand/InherentMarks.tsx` — not a redraw. Both the logomark
and the horizontal lockup inherit `currentColor`, so they render cream on
charcoal and charcoal on cream, exactly as the sheet specifies. The wordmark's
high-contrast serif (Instrument Serif) is used for page titles.

To change any of it: edit `src/lib/brand.ts` and mirror the values in the
`@theme` block of `src/app/globals.css`. Nothing else hardcodes a colour.

### Client brand logos

Each client brand carries its own logo and colour, set during onboarding
(**Brands → New brand**) or later from the brand's Edit screen. The file is
read in the browser and stored as a data URI, so there is no upload endpoint or
object storage to configure — SVG, PNG, JPG or WebP up to 512KB. A brand
without a logo falls back to an initials tile in its own colour, so the OS
never looks broken while you are still collecting assets.

## Stack

| | |
| --- | --- |
| Framework | Next.js 16 (App Router, Server Actions) |
| Language | TypeScript, strict |
| Data | Prisma + Postgres (Supabase) |
| Styling | Tailwind v4, CSS custom properties |
| Auth | Custom sessions: scrypt hashing, HMAC-signed httpOnly cookies |

No auth provider, no component library, no state manager. Mutations are Server
Actions; every one writes to an append-only activity feed.

### Deploying — Vercel + Supabase

**1. Supabase.** In your project, open **Project Settings → Database →
Connection string** and copy both: the **Transaction pooler** string (port
6543) and the **Direct connection** string (port 5432).

**2. Vercel.** Import the repo (**Add New → Project**). Vercel detects Next.js;
`vercel.json` already sets the build command. Add these environment variables
to Production *and* Preview:

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | the pooled string + `?pgbouncer=true&connection_limit=1` |
| `DIRECT_URL` | the direct string |
| `AUTH_SECRET` | `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `ALLOWED_EMAIL_DOMAIN` | `inherentglobal.com` |
| `SEED_PASSWORD` | a password for the first sign-in |

**Checking a deployment.** `GET /api/health` answers in one curl: `200` when
the OS can serve, `503` with a machine-readable reason when it cannot. If the
database is unreachable or unmigrated, every page shows a setup screen naming
the problem instead of a bare 500 — and it recovers on its own once the
database is healthy, with no redeploy.

```bash
curl -s https://<deployment>/api/health | jq
```

**3. Create the schema.** Migrations do not run on Vercel — its build step has
no business writing to your database. Run them once from your machine:

```bash
DIRECT_URL="<the direct string>" DATABASE_URL="<the direct string>" \
  npx prisma migrate deploy

DIRECT_URL="<the direct string>" DATABASE_URL="<the direct string>" \
  npx tsx prisma/seed.ts
```

Both use the **direct** string. Then deploy, and sign in.

**4. Optional — deploy from CI instead.** `.github/workflows/deploy-vercel.yml`
migrates, seeds if the database is empty, deploys, and then checks the
sign-in page actually loads before calling it done. It needs four repository
secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` (the last two
come from `.vercel/project.json` after `vercel link`) and `DIRECT_URL`. If you
would rather not manage a token, Vercel's own Git integration covers steps 1–3
with no workflow at all.

### Self-hosting instead

```bash
AUTH_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))") \
  docker compose up -d --build
```

Brings up Postgres and the app together. The entrypoint applies migrations,
seeds only a genuinely empty database, and refuses to start on a placeholder
`AUTH_SECRET`. A prebuilt image is published to
`ghcr.io/medinaoliva4-tech/os:edge` on every push.

## Commands

```bash
npm run dev          # development server
npm run build        # production build (runs prisma generate first)
npm run start        # serve the production build
npm run lint         # eslint
npm run typecheck    # tsc --noEmit
npm run setup        # migrate + seed
npm run db:migrate   # create a migration from schema changes
npm run db:deploy    # apply migrations (production)
npm run db:seed      # re-run the seed (idempotent)
npm run db:reset     # drop, re-migrate and reseed — destroys data
npm run db:studio    # browse the data
npm run verify:seed  # assert the seed invariants
```

---

## Layout

```
prisma/
  schema.prisma          15 models: the CRM half and the production half
  migrations/            versioned schema history
  seed.ts                team, brands, pendientes, integrations
scripts/
  is-empty.ts            "does this database still need seeding?"
  verify-seed.ts         post-seed invariants, asserted in CI
src/
  app/
    (auth)/login         sign-in, domain-gated
    (app)/               every authenticated screen
    actions/             server actions, grouped by domain
  components/
    shell/               sidebar, topbar, command palette (⌘K), theme
    ui/                  Card, Chip, Avatar, Icon, Meter, PageHeader
  lib/
    policy.ts            the domain lock
    session.ts           signed-cookie sessions
    brand.ts             brand tokens — the swap point
    domain.ts            shared vocabulary: stages, statuses, tones
    pipeline-blueprint.ts  the nine content-system checkpoints
```
