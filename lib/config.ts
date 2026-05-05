/**
 * Global fundraising goal used for team race tracker calculations.
 * Individual athletes have their own goals stored in the database.
 */
export const GLOBAL_ATHLETE_GOAL = 200;

export const MIN_DONATION_AMOUNT = 1;
export const MAX_DONATION_AMOUNT = 999_999;
export const DEFAULT_DONATION_AMOUNT = 50;

/**
 * When false, all donation entry points are hidden and the payment-intent
 * API returns 410 Gone. Flip to true to reopen donations for a future event.
 */
export const DONATIONS_ENABLED = false;
