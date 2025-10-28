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

### Database Schema (SQLite)

```sql
-- Teams table
teams (
  id INTEGER PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  color TEXT, -- For visual representation in race tracker
  total_raised DECIMAL DEFAULT 0 -- Cached total for performance
)

-- Athletes table
athletes (
  id INTEGER PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL, -- URL-friendly name for /donate/[slug]
  name TEXT NOT NULL,
  team_id INTEGER REFERENCES teams(id),
  bio TEXT, -- Optional personal message/story
  photo_url TEXT, -- Optional athlete photo
  total_raised DECIMAL DEFAULT 0, -- Cached total for performance
  goal DECIMAL DEFAULT 500, -- Individual fundraising goal
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)

-- Donations table (minimal tracking for totals only)
donations (
  id INTEGER PRIMARY KEY,
  athlete_id INTEGER REFERENCES athletes(id),
  amount DECIMAL NOT NULL,
  stripe_payment_intent_id TEXT UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
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

/components
  /AthleteSearch.tsx       // Real-time search filtering
  /TeamRaceTracker.tsx     // Animated visualization of team competition
  /DonationForm.tsx        // Stripe embedded payment element
  /AthleteCard.tsx         // Clickable card showing athlete info & progress
  /ProgressBar.tsx         // Visual indicator of fundraising progress

/lib
  /db.ts                   // SQLite connection & query functions
  /stripe.ts              // Stripe client configuration
  /utils.ts               // Helper functions (formatting, calculations)

/scripts
  /seed-database.ts       // Import initial athlete/team data from JSON
```

### Key Implementation Details

#### 1. Homepage (`/app/page.tsx`)

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

#### 2. Athlete Donation Page (`/donate/[slug]`)

Individual donation page flow:

**Athlete Information Display:**

- Large photo (if available) or placeholder
- Name and team
- Bio/personal message
- Progress bar: "$X raised of $Y goal = Z miles"

**Donation Form:**

- Preset amounts: $25 (25 miles), $50 (50 miles), $100 (100 miles)
- Custom amount input with validation
- Embedded Stripe payment element
- "Donate" button with amount confirmation

**Implementation:**

```typescript
// Key flow:
1. Load athlete data from API
2. Initialize Stripe Elements
3. On amount selection → update UI to show "Donate $X = X miles"
4. On submit → create payment intent via API
5. Process payment with Stripe
6. On success → redirect to thank you page
```

#### 3. Stripe Integration

**Payment Flow:**

```typescript
// Frontend (DonationForm component)
- Use @stripe/react-stripe-js for embedded payments
- Create payment intent with athlete_id in metadata
- Handle card validation and errors inline

// Backend (/api/webhooks/stripe/route.ts)
POST endpoint receiving Stripe webhooks:
1. Verify webhook signature
2. Extract payment_intent.succeeded event
3. Get athlete_id from metadata
4. Record donation in database
5. Update athlete total_raised
6. Update team total_raised
7. Return 200 to acknowledge
```

#### 4. Database Operations (`/lib/db.ts`)

Essential functions:

```typescript
// Read operations
getAthletes(): Athlete[] // All athletes with totals
getAthlete(slug: string): Athlete // Single athlete by slug
getTeamsWithTotals(): Team[] // For race visualization
getBikeathonTotal(): number // Sum of all donations

// Write operations
recordDonation(athleteId, amount, stripeId): void
updateAthleteTotal(athleteId): void // Recalculate from donations
updateTeamTotal(teamId): void // Sum of team members
```

#### 5. Thank You Page (`/app/thank-you/page.tsx`)

Post-donation confirmation showing:

- "Thank you for your donation!"
- "You've sponsored X miles for [Athlete Name]"
- Link back to homepage
- Current team standings

### Development Milestones

**Phase 1: Foundation (4-6 hours)**

- Next.js project setup with TypeScript and Tailwind
- SQLite database with schema
- Seed script to populate initial data
- Basic API routes for data fetching

**Phase 2: Donation Flow (6-8 hours)**

- Stripe account setup and configuration
- Individual athlete pages
- Embedded payment form
- Webhook handler for payment confirmation
- Database updates on successful payment

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
- Deployment to Vercel

### Environment Configuration

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Database
DATABASE_URL=file:./local.db

# App Configuration
NEXT_PUBLIC_BASE_URL=https://your-bikeathon.vercel.app
NEXT_PUBLIC_CURRENCY=USD
```

### Initial Setup Commands

```bash
# Create Next.js project with TypeScript and Tailwind
npx create-next-app@latest bikeathon-fundraiser --typescript --tailwind --app

# Install required dependencies
npm install stripe @stripe/stripe-js @stripe/react-stripe-js
npm install better-sqlite3 @types/better-sqlite3
npm install lucide-react framer-motion

# Create database and seed initial data
npm run db:setup
npm run db:seed

# Start development
npm run dev
```

### Sample Data Structure

```json
// initial-data.json for seeding
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
      "photoUrl": "/images/athletes/john-smith.jpg"
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
