# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Bikeathon fundraising platform built with Next.js 16, TypeScript, Prisma ORM, and Stripe. It allows donors to support athletes participating in a bikeathon event where $1 donated = 1 mile the athlete commits to riding.

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
- **Donation**: Payment records linked to athletes with Stripe payment intent IDs

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

### Miami Theme Colors

The application uses University of Miami branding:

- Primary Orange: `#f47321`
- Secondary Green: `#005030`
- Extended palettes defined in `app/globals.css`

## Development Workflow

1. **Making Schema Changes**: Edit `prisma/schema.prisma`, then run `bun run db:migrate` to create migration
2. **Testing Payments**: Use Stripe test card `4242 4242 4242 4242` with any future date
3. **Viewing Database**: Run `bun run db:studio` for visual database editor
4. **Adding Athletes/Teams**: Edit `prisma/seed-data.json` and run `bun run db:seed`

## Common Tasks

### Add New API Endpoint

Create route handler in `app/api/[endpoint]/route.ts` following Next.js App Router conventions.

### Modify Donation Processing

Edit webhook handler at `app/api/webhooks/stripe/route.ts`. Ensure atomic transactions.

### Update UI Components

Components in `components/` directory. Use Tailwind classes and maintain Miami color theme.

### Deploy to Production

Push to main branch triggers Vercel deployment. Database migrations run automatically via `vercel:build` script.
