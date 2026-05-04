# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Bikeathon fundraising platform built with Next.js 16, TypeScript, Prisma ORM, and Stripe. It allows donors to support athletes participating in a bikeathon event.

## Key Commands

### Development

```bash
bun run dev          # Start development server on port 3000
bun run db:studio    # Open Prisma Studio to view/edit database
```

### Database Operations

```bash
bun run db:generate        # Generate Prisma client after schema changes
bun run db:push           # Push schema changes to database (development)
bun run db:migrate        # Create and apply new migration
bun run db:migrate:deploy # Deploy migrations (production)
bun run db:seed          # Seed database with initial data
bun run db:reset         # Reset database and reseed
```

### Build & Production

```bash
bun run build         # Build for production
bun run start         # Start production server
bun run vercel:build  # Build command for Vercel deployment
```

### Testing & Code Quality

```bash
bun run lint          # Run ESLint
```

## Architecture & Code Structure

### Core Application Flow

1. **Homepage (`app/page.tsx`)**: Displays overall stats, team competition tracker, and searchable athlete grid
2. **Donation Page (`app/donate/[slug]/page.tsx`)**: Individual athlete pages with Stripe payment form
3. **Payment Processing**:
   - Client creates payment intent via `/api/create-payment-intent`
   - Stripe processes payment
   - Webhook at `/api/webhooks/stripe` confirms payment and updates database
4. **Thank You Page (`app/thank-you/page.tsx`)**: Confirms donation with details

### Database Architecture (Prisma + PostgreSQL)

- **Team**: Represents competing teams with color coding and fundraising totals
- **Athlete**: Individual participants linked to teams with personal goals
- **Donation**: Payment records linked to athletes with Stripe payment intent IDs and optional `donorName` for public attribution

Key relationships:

- One Team has many Athletes
- One Athlete has many Donations
- Totals cascade: Donation → Athlete.totalRaised → Team.totalRaised

### API Endpoints

- `GET /api/athletes` - All athletes with stats
- `GET /api/teams` - Teams with member details
- `GET /api/stats` - Overall bikeathon statistics
- `POST /api/create-payment-intent` - Initialize Stripe payment
- `POST /api/webhooks/stripe` - Handle Stripe webhook events

### Component Structure

- **AthleteCard**: Display athlete in grid with progress
- **DonationForm**: Stripe Elements payment form
- **TeamRaceTracker**: Visual team competition display
- **AthleteSearch**: Debounced search functionality

### Shared Modules (`lib/`)

- `lib/prisma.ts` - Prisma client singleton (use this, never `new PrismaClient()`)
- `lib/stripe-server.ts` - Server-side Stripe client (webhooks, payment intents)
- `lib/stripe-client.ts` - Client-side Stripe.js loader
- `lib/config.ts` - Runtime config (amount limits, currency)
- `lib/utils.ts` - Shared utilities (currency formatting, slugs)

### Operational Scripts

- `create-athlete.sh` - Interactive script to add a new athlete (avoids manual seed-data edits)
- `production-updates.sh` - Helpers for production data updates
- `scripts/` - One-off data migration / utility scripts

### Key Libraries & Integrations

- **Stripe Integration**: Payment processing with webhook confirmation
- **Prisma ORM**: Type-safe database access with migrations
- **Tailwind CSS v4**: Styling with Miami-themed custom colors
- **Framer Motion**: Animations and transitions

## Important Implementation Details

### Stripe Payment Flow

1. Amount validation: $1 minimum, $999,999 maximum
2. Payment intent created server-side with metadata
3. Webhook signature verification for security
4. Atomic database updates using Prisma transactions
5. Idempotency checks prevent duplicate donations

### Database Transactions

When processing donations, always use Prisma transactions to ensure atomicity:

```typescript
await prisma.$transaction([
  // Create donation
  // Update athlete totalRaised
  // Update team totalRaised
])
```

### Environment Variables Required

- `PRISMA_DATABASE_URL` - PostgreSQL connection string
- `STRIPE_SECRET_KEY` - Stripe secret key
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key
- `STRIPE_WEBHOOK_SECRET` - Webhook endpoint secret
- `NEXT_PUBLIC_BASE_URL` - Public app URL (used in metadata, redirects)
- `NEXT_PUBLIC_CURRENCY` - Currency code (defaults to USD)
- `ADMIN_PASSWORD` - Shared password for `/admin` UI login and Bearer-token API auth (shell scripts read this as `PROD_ADMIN_PASSWORD`)
- `ADMIN_SESSION_SECRET` - 32+ random bytes that sign the `/admin` session cookie (`openssl rand -base64 32`)

### Miami Theme Colors

The application uses University of Miami branding:

- Primary Orange: `#f47321`
- Secondary Green: `#005030`
- Extended palettes defined in `app/globals.css`

## Development Workflow

1. **Making Schema Changes**: Edit `prisma/schema.prisma`, then run `bun run db:migrate` to create migration
2. **Testing Payments**: Use Stripe test card `4242 4242 4242 4242` with any future date
3. **Viewing Database**: Run `bun run db:studio` for visual database editor
4. **Adding Athletes/Teams**: Edit `prisma/seed-data.json` and run `bun run db:seed` (full reseed). For one-off additions, use the `/admin` UI or `./create-athlete.sh`.
5. **Admin dashboard**: `/admin` provides UI parity with the shell scripts (athlete create + edit, team edit). Login uses `ADMIN_PASSWORD`; session cookie keyed by `ADMIN_SESSION_SECRET`. The shell scripts still work for headless / batch use.

## Gotchas

- **Decimal arithmetic**: `totalRaised`, `amount`, `goal` use Prisma `Decimal` (not JS number). Use `decimal.js` for math, convert with `.toString()` before JSON, or rounding errors will appear.
- **Webhook idempotency**: Stripe may deliver the same `payment_intent.succeeded` event multiple times. The unique constraint on `Donation.stripePaymentIntentId` is the dedup gate — never remove it.
- **Always use `lib/prisma.ts`**: Instantiating new `PrismaClient` per request exhausts connections in serverless. Import the singleton.
- **Adding athletes**: Prefer `./create-athlete.sh` for production-style additions; `prisma/seed-data.json` + `db:seed` is for full reseeds (destructive).
- **Schema → migration**: Always `db:migrate` (never `db:push` on shared/prod databases) so migrations get committed.
