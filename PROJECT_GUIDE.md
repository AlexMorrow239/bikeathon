# Bikeathon Fundraising Website - Technical Implementation Guide

## Project Context

This is a fundraising platform for a club's bikeathon event where teams of athletes compete to raise money. The core concept is **"$1 = 1 mile"** - every dollar donated translates to one mile that the athlete will ride. Teams compete against each other to see who can raise the most money (and therefore commit to riding the most miles), creating a fun competitive element that encourages more donations.

The website serves as the central donation hub where friends, family, and supporters can easily find their athlete and contribute to their fundraising goal. The competitive team aspect adds gamification to encourage higher total fundraising for the club.

## Primary User Story

**As a donor (friend/family member of an athlete), I want to:**

1. Search for and find my athlete by name
2. View their profile, team affiliation, and current fundraising progress
3. Make a donation in their name using my credit card
4. See confirmation that my donation was successful
5. Know that my donation counts toward both the athlete's individual total and their team's total

**Success Criteria:**

- Donor can complete entire flow in under 2 minutes
- Search instantly filters to find specific athlete
- Payment process is secure and seamless via Stripe
- Real-time updates to fundraising totals after donation
- Visual feedback showing team competition status

## Technical Architecture Overview

### Core Concept

Athletes are pre-registered in the system (no self-signup). Each athlete belongs to a team. Donors visit the site, find their athlete, and donate. The site tracks three key metrics:

- Individual athlete's total raised (miles committed)
- Team totals (sum of team members' fundraising)
- Overall bikeathon total (sum of all donations)

### Database Schema (PostgreSQL via Prisma)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Team {
  id          Int       @id @default(autoincrement())
  name        String    @unique
  color       String    // Hex color for visual representation
  totalRaised Decimal   @default(0) @db.Decimal(10, 2)
  athletes    Athlete[]
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model Athlete {
  id          Int        @id @default(autoincrement())
  slug        String     @unique // URL-friendly name for /donate/[slug]
  name        String
  bio         String?    // Optional personal message
  photoUrl    String?    // Optional athlete photo
  totalRaised Decimal    @default(0) @db.Decimal(10, 2)
  goal        Decimal    @default(500) @db.Decimal(10, 2)
  teamId      Int
  team        Team       @relation(fields: [teamId], references: [id])
  donations   Donation[]
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  @@index([slug])
  @@index([teamId])
}

model Donation {
  id                    Int      @id @default(autoincrement())
  amount                Decimal  @db.Decimal(10, 2)
  stripePaymentIntentId String   @unique
  athleteId             Int
  athlete               Athlete  @relation(fields: [athleteId], references: [id])
  createdAt             DateTime @default(now())

  @@index([athleteId])
}
```

### Project Structure

```
/app
  /page.tsx                 // Homepage: search bar, athlete grid, team race visual
  /donate
    /[slug]/page.tsx       // Individual athlete donation page
  /thank-you/page.tsx      // Post-donation success page with miles message
  /api
    /webhooks
      /stripe/route.ts     // Stripe webhook to confirm payment & update DB
    /athletes/route.ts     // GET all athletes with search capability
    /teams/route.ts        // GET teams with current totals for race visual
    /create-payment-intent/route.ts // POST to create Stripe payment intent

/components
  /AthleteSearch.tsx       // Real-time search filtering
  /TeamRaceTracker.tsx     // Animated visualization of team competition
  /DonationForm.tsx        // Stripe embedded payment element
  /AthleteCard.tsx         // Clickable card showing athlete info & progress
  /ProgressBar.tsx         // Visual indicator of fundraising progress

/lib
  /prisma.ts              // Prisma client singleton
  /stripe.ts              // Stripe client configuration
  /utils.ts               // Helper functions (formatting, calculations)

/prisma
  /schema.prisma          // Database schema
  /seed.ts                // Seed script for initial data
  /migrations/            // Database migration history

/scripts
  /update-totals.ts       // Utility script to recalculate all totals
```

### Key Implementation Details

#### 1. Database Setup with Prisma

**Prisma Client Singleton (`/lib/prisma.ts`):**

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
```

**Seed Script (`/prisma/seed.ts`):**

```typescript
import { PrismaClient } from '@prisma/client'
import { teams, athletes } from './seed-data.json'

const prisma = new PrismaClient()

async function main() {
  // Clear existing data
  await prisma.donation.deleteMany()
  await prisma.athlete.deleteMany()
  await prisma.team.deleteMany()

  // Seed teams
  for (const team of teams) {
    await prisma.team.create({
      data: {
        name: team.name,
        color: team.color
      }
    })
  }

  // Seed athletes
  for (const athlete of athletes) {
    const team = await prisma.team.findUnique({
      where: { name: athlete.team }
    })

    await prisma.athlete.create({
      data: {
        name: athlete.name,
        slug: athlete.slug,
        bio: athlete.bio,
        photoUrl: athlete.photoUrl,
        teamId: team!.id,
        goal: athlete.goal || 500
      }
    })
  }
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect())
```

#### 2. Homepage (`/app/page.tsx`)

The landing page serves as the donation hub with three main sections:

**Hero Section:**

- Bikeathon branding and "$1 = 1 Mile" messaging
- Overall fundraising total prominently displayed
- Call-to-action to search for an athlete

**Team Race Tracker:**

- Visual representation of team competition (e.g., bicycles racing on a track)
- Each team represented by colored sprite/icon
- Position based on percentage of total fundraising
- Real-time animation when totals update

**Athlete Search & Grid:**

- Search bar with instant client-side filtering
- Grid of athlete cards showing:
  - Name and photo
  - Team affiliation (with team color accent)
  - Current amount raised / goal
  - "Donate" button linking to their page

#### 3. Athlete Donation Page (`/donate/[slug]`)

Individual donation page flow:

**Data Fetching:**

```typescript
// Server component to fetch athlete data
import prisma from '@/lib/prisma'

async function getAthlete(slug: string) {
  return await prisma.athlete.findUnique({
    where: { slug },
    include: { team: true }
  })
}
```

**Donation Form Implementation:**

```typescript
// Key flow:
1. Load athlete data with Prisma
2. Initialize Stripe Elements
3. On amount selection → update UI to show "Donate $X = X miles"
4. On submit → create payment intent via API
5. Process payment with Stripe
6. On success → redirect to thank you page
```

#### 4. API Routes with Prisma

**Athletes Endpoint (`/app/api/athletes/route.ts`):**

```typescript
import prisma from '@/lib/prisma'

export async function GET() {
  const athletes = await prisma.athlete.findMany({
    include: {
      team: true,
      _count: {
        select: { donations: true }
      }
    },
    orderBy: { totalRaised: 'desc' }
  })

  return Response.json(athletes)
}
```

**Stripe Webhook (`/app/api/webhooks/stripe/route.ts`):**

```typescript
import prisma from '@/lib/prisma'
import Stripe from 'stripe'

export async function POST(req: Request) {
  // Verify webhook signature
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  const sig = req.headers.get('stripe-signature')!

  // Process payment_intent.succeeded
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object
    const athleteId = parseInt(paymentIntent.metadata.athlete_id)
    const amount = paymentIntent.amount / 100

    // Use Prisma transaction for data consistency
    await prisma.$transaction(async (tx) => {
      // Record donation
      await tx.donation.create({
        data: {
          amount,
          stripePaymentIntentId: paymentIntent.id,
          athleteId
        }
      })

      // Update athlete total
      await tx.athlete.update({
        where: { id: athleteId },
        data: {
          totalRaised: { increment: amount }
        }
      })

      // Update team total
      const athlete = await tx.athlete.findUnique({
        where: { id: athleteId },
        select: { teamId: true }
      })

      await tx.team.update({
        where: { id: athlete!.teamId },
        data: {
          totalRaised: { increment: amount }
        }
      })
    })
  }

  return Response.json({ received: true })
}
```

#### 5. Database Operations

**Common Prisma Queries:**

```typescript
// Get all athletes with team info
const athletes = await prisma.athlete.findMany({
  include: { team: true }
})

// Get single athlete by slug
const athlete = await prisma.athlete.findUnique({
  where: { slug },
  include: { team: true }
})

// Get teams with totals for race visualization
const teams = await prisma.team.findMany({
  orderBy: { totalRaised: 'desc' },
  include: {
    _count: { select: { athletes: true } }
  }
})

// Get bikeathon total
const result = await prisma.donation.aggregate({
  _sum: { amount: true }
})
const total = result._sum.amount || 0

// Recent donations (optional feature)
const recentDonations = await prisma.donation.findMany({
  take: 10,
  orderBy: { createdAt: 'desc' },
  include: {
    athlete: {
      include: { team: true }
    }
  }
})
```

### Development Milestones

**Phase 1: Foundation (4-6 hours)**

- Next.js project setup with TypeScript and Tailwind
- PostgreSQL database setup (local or cloud)
- Prisma schema definition and migration
- Seed script for initial data
- Basic API routes with Prisma queries

**Phase 2: Donation Flow (6-8 hours)**

- Stripe account setup and configuration
- Individual athlete pages with Prisma data fetching
- Embedded payment form
- Webhook handler with Prisma transactions
- Payment confirmation flow

**Phase 3: User Experience (4-6 hours)**

- Homepage with athlete grid
- Real-time search functionality
- Team race visualization
- Responsive mobile design
- Thank you page flow

**Phase 4: Polish (2-4 hours)**

- Error handling and loading states
- Progress bars and animations
- Testing donation flow end-to-end
- Deployment to Vercel with production database

### Environment Configuration

```env
# Database - PostgreSQL connection string
# For local: postgresql://user:password@localhost:5432/bikeathon
# For production: Use connection string from provider (Supabase, Neon, etc.)
DATABASE_URL="postgresql://user:password@localhost:5432/bikeathon"

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# App Configuration
NEXT_PUBLIC_BASE_URL=https://your-bikeathon.vercel.app
NEXT_PUBLIC_CURRENCY=USD
```

### Initial Setup Commands

```bash
# Create Next.js project with TypeScript and Tailwind
npx create-next-app@latest bikeathon-fundraiser --typescript --tailwind --app

# Install required dependencies
npm install @prisma/client prisma
npm install stripe @stripe/stripe-js @stripe/react-stripe-js
npm install lucide-react framer-motion
npm install decimal.js # For handling currency calculations

# Initialize Prisma with PostgreSQL
npx prisma init --datasource-provider postgresql

# After creating schema.prisma, generate Prisma Client
npx prisma generate

# Create and apply database migration
npx prisma migrate dev --name init

# Seed the database with initial data
npx prisma db seed

# Start development
npm run dev
```

### Package.json Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:seed": "prisma db seed",
    "db:studio": "prisma studio",
    "postinstall": "prisma generate"
  },
  "prisma": {
    "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
  }
}
```

### Database Deployment Options for Vercel

**Recommended PostgreSQL Providers:**

1. **Vercel Postgres** - Native integration, easiest setup
2. **Supabase** - Free tier available, good for prototypes
3. **Neon** - Serverless Postgres, scales to zero
4. **Railway** - Simple deployment with good free tier

**Connection Pooling:** For production, use Prisma with connection pooling:

```prisma
// prisma/schema.prisma for production
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL") // For migrations
}
```

### Sample Seed Data Structure

```json
// prisma/seed-data.json
{
  "teams": [
    { "name": "Thunder Riders", "color": "#FFD700" },
    { "name": "Wind Breakers", "color": "#4169E1" },
    { "name": "Chain Gang", "color": "#32CD32" }
  ],
  "athletes": [
    {
      "name": "John Smith",
      "slug": "john-smith",
      "team": "Thunder Riders",
      "bio": "Riding for a great cause! Every mile counts.",
      "photoUrl": "/images/athletes/john-smith.jpg",
      "goal": 500
    }
    // ... more athletes
  ]
}
```

### Key UX Considerations

1. **Mobile-First**: Most donors will likely be on mobile devices
2. **Instant Search**: Client-side filtering for immediate results
3. **Clear CTAs**: "Donate" buttons prominently displayed
4. **Trust Signals**: Stripe secure payment badges
5. **Progress Visualization**: Show impact of donations immediately
6. **Shareable URLs**: Each athlete page has a unique URL for easy sharing
