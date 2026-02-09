# SproutStocks

A stock trading platform built for kids. Children earn virtual money by completing chores (approved by parents), then invest in real stocks using live market data. Parents maintain full oversight — approving chores, monitoring portfolios, and handling cash-outs.

The idea: teach kids how investing works with real stock prices, but without real financial risk.

## Tech Stack

- **Framework:** Next.js 16 (App Router) + TypeScript
- **Database:** PostgreSQL on Supabase, managed with Prisma 7
- **Auth:** Clerk (parent accounts only — children use PIN-based login under the parent's family)
- **Stock Data:** Finnhub API (free tier, daily price caching)
- **UI:** Tailwind CSS + shadcn/ui + Recharts for charts
- **Testing:** Vitest (unit) + Playwright (E2E)
- **Deployment:** Vercel

## Features

- **Parent dashboard** — create child accounts, assign chores, approve completions, monitor all portfolios, track real money owed
- **Child dashboard** — view balance, browse/search stocks, buy and sell with fractional shares ($5 minimum)
- **Live stock data** — prices pulled from Finnhub, cached daily at market close (4:30pm ET cron)
- **Portfolio tracking** — holdings display, daily performance snapshots, transaction history (2-month window)
- **Cash-out system** — gains-only withdrawals, rounded to $5, requires parent approval
- **Dark mode** — system preference detection

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (Supabase works well)
- [Clerk](https://clerk.com) account
- [Finnhub](https://finnhub.io) API key (free tier)

### Setup

1. Clone the repo and install dependencies:

```bash
git clone <repo-url>
cd stock-trading-kids
npm install
```

2. Copy `.env.example` to `.env.local` and fill in your keys:

```
DATABASE_URL=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
FINNHUB_API_KEY=
```

3. Generate Prisma client and run migrations:

```bash
npx prisma generate
npx prisma migrate dev
```

4. Start the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to get started.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Build for production |
| `npm test` | Run unit tests (watch mode) |
| `npm run test:run` | Run unit tests (single run) |
| `npm run test:e2e` | Run E2E tests headless |
| `npm run test:e2e:ui` | Run E2E tests with browser UI |
| `npx prisma studio` | Open Prisma database viewer |
| `npx prisma migrate dev` | Run database migrations |

## Architecture Notes

- **No webhooks for auth sync** — Clerk-to-database sync happens on first visit. After Clerk signup, parents hit `/onboarding` which creates their Family + User records in a single transaction.
- **Children don't have Clerk accounts** — parents create child records from their dashboard. Children get synthetic IDs and log in via a family PIN at `/child-login`.
- **Trades use last close price** — no real-time trading. Prices update daily via cron job.
- **Fractional shares** — stored at 6 decimal precision internally, displayed as 2 decimals in the UI.
