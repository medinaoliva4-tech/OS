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

`src/lib/brand.ts` is the single source of truth for the look, and it is the
only file you need to touch to make the OS match inherentglobal.com exactly.

> **The palette shipped here is an interpretation, not a scrape.** The live site
> was unreachable from the build environment, so the values are placeholders
> chosen to be quiet and premium.

To make it exact:

1. Replace the hex values in `src/lib/brand.ts`.
2. Mirror them in the `@theme` block of `src/app/globals.css`.
3. Drop the real wordmark into `public/` and point `brand.logo.src` at it.

Nothing else in the codebase hardcodes a brand colour.

---

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

### Going to production

1. **Set `AUTH_SECRET`** to a real random value —
   `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
   Settings warns while it is still the development default.
2. **Move off SQLite** — change `provider` to `postgresql` in
   `prisma/schema.prisma` and point `DATABASE_URL` at your database.
3. **Change both seeded passwords.**

---

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
