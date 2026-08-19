# Inherent OS

The CRM and operating system for **Inherent Global** — one place for who we
sell to, what we owe each brand, and where every asset actually lives.

It is built around a single idea: **the brand is the spine**. Every deal, task,
content piece, asset and guideline hangs off one brand, so opening NAO shows
its pipeline, its calendar, its pendientes and its asset store together instead
of scattered across six tools.

---

## Running it

```bash
npm install
cp .env.example .env      # defaults work as-is for local development
npm run setup             # generate client + create the database + seed it
npm run dev               # http://localhost:3000
```

`npm run setup` is safe to re-run — the seed is idempotent.

### Signing in

Two accounts are created by the seed:

| Person | Email | Role |
| --- | --- | --- |
| Rodrigo Medina | `rodrigomedina@inherentglobal.com` | Owner (CEO) |
| Pablo Rodriguez | `pablorodriguez@inherentglobal.com` | Admin |

Both start with the password in `SEED_PASSWORD` (default `Inherent2026!`).
**Change them from Settings after the first sign-in.**

---

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
| Data | Prisma + SQLite |
| Styling | Tailwind v4, CSS custom properties |
| Auth | Custom sessions: scrypt hashing, HMAC-signed httpOnly cookies |

No auth provider, no component library, no state manager. Mutations are Server
Actions; every one writes to an append-only activity feed.

### Deploying

**Before anything else**, set a real `AUTH_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

The container refuses to start on a placeholder value, and Settings warns while
the local one is still the development default.

#### Docker (self-hosted)

```bash
AUTH_SECRET=<the value you just generated> docker compose up -d --build
```

That is the whole thing. The image carries its own SQLite database on a named
volume, so there is nothing to provision. On first boot the entrypoint creates
the schema and seeds the founding team; on every later boot it applies schema
changes and leaves your data alone.

#### Vercel

Next.js deploys to Vercel with no config, but **SQLite does not survive a
serverless filesystem** — move to Postgres first:

1. Change `provider` to `postgresql` in `prisma/schema.prisma`.
2. Set `DATABASE_URL` to your Postgres connection string in the Vercel project.
3. Set `AUTH_SECRET`, and any integration credentials you want live.
4. Run `npx prisma db push && npx tsx prisma/seed.ts` against that database once.

#### Any Node host

`npm ci && npm run build && npm run start`, with `DATABASE_URL` and
`AUTH_SECRET` set. `output: "standalone"` is enabled, so `.next/standalone`
also works as a minimal self-contained bundle.

## Commands

```bash
npm run dev         # development server
npm run build       # production build (runs prisma generate first)
npm run start       # serve the production build
npm run lint        # eslint
npm run typecheck   # tsc --noEmit
npm run db:seed     # re-run the seed (idempotent)
npm run db:reset    # wipe and reseed the local database
```

---

## Layout

```
prisma/
  schema.prisma          15 models: the CRM half and the production half
  seed.ts                team, brands, pendientes, integrations
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
