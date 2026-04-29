# Melli Exchange

Currency exchange website for Melli Exchange (Coquitlam, BC). pnpm monorepo containing:

- **`apps/web`** — public Next.js website (port `3000`)
- **`apps/admin`** — Next.js admin panel for editing prices (port `3001`)
- **`apps/api`** — Express + MongoDB API (port `4000`)
- **`packages/ui`** — shared design system (Button, Card, Input, etc.)
- **`packages/config`** — shared Tailwind preset
- **`packages/types`** — shared TypeScript types between API and frontends

## Prerequisites

- Node.js 20+
- pnpm 9+
- MongoDB running locally (or a connection string to MongoDB Atlas)

## First-time setup

```bash
pnpm install

# copy env files
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
cp apps/admin/.env.example apps/admin/.env

# place the brand logo
# put the same file at:
#   apps/web/public/logo.png
#   apps/admin/public/logo.png

# seed the database (creates admin user + initial currencies + gold prices)
pnpm seed
```

## Run all three apps in parallel

```bash
pnpm dev
```

Then visit:

| What | URL |
|---|---|
| Public site | http://localhost:3000 |
| Admin panel | http://localhost:3001 |
| API health | http://localhost:4000/health |

Sign in to the admin panel with the credentials set in `apps/api/.env`
(`ADMIN_EMAIL` / `ADMIN_PASSWORD`, defaults `admin@melliexchange.local` / `changeme`).

## Architecture

```
melli-exchange/
├── apps/
│   ├── web/          Public site (Next.js App Router)
│   ├── admin/        Admin panel (Next.js App Router)
│   └── api/          Express + MongoDB
└── packages/
    ├── ui/           Design system
    ├── config/       Tailwind preset
    └── types/        Shared TS types
```

### Data model

- `currencies` — `{ code, name, symbol, flag, buy, sell, order, updatedAt }`
- `goldPrices` — `{ karat (18|22|24), pricePerGram, updatedAt }`
- `admins` — `{ email, passwordHash }`

### API

Public:

- `GET /api/currencies`
- `GET /api/gold`

Admin (JWT cookie required):

- `POST /api/auth/login` · `POST /api/auth/logout` · `GET /api/auth/me`
- `POST /api/currencies` · `PUT /api/currencies/:code` · `DELETE /api/currencies/:code`
- `PUT /api/gold/:karat`

### Auth

JWT stored in an `httpOnly` cookie. Single admin user seeded from environment variables. Frontends call the API with `credentials: 'include'`; CORS is restricted to the configured origins.

## Scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Run web + admin + api in parallel |
| `pnpm build` | Build everything |
| `pnpm seed` | Seed admin + initial currencies + gold prices |
| `pnpm --filter @melli/api dev` | Run only the API |
| `pnpm --filter @melli/web dev` | Run only the public site |
| `pnpm --filter @melli/admin dev` | Run only the admin panel |

## What's next

This is v1 — intentionally simple. Likely follow-ups:

- Real domain + production deploy (Vercel for frontends, Render/Railway/Fly for API, MongoDB Atlas)
- Rate-history collection for charts
- Contact form with email delivery
- i18n (Persian + RTL)
- Multi-admin with roles
