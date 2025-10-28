import Stripe from 'stripe';
import { loadStripe, Stripe as StripeJS } from '@stripe/stripe-js';

// Server-side Stripe client
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
  typescript: true,
});

// Client-side Stripe promise
let stripePromise: Promise<StripeJS | null>;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
  }
  return stripePromise;
};

// Helper function to construct webhook event
export const constructWebhookEvent = (
  payload: string | Buffer,
  signature: string,
  secret: string
): Stripe.Event => {
  return stripe.webhooks.constructEvent(payload, signature, secret);
};

// Helper to format amount for Stripe (convert dollars to cents)
export const formatAmountForStripe = (amount: number): number => {
  return Math.round(amount * 100);
};

// Helper to format amount from Stripe (convert cents to dollars)
export const formatAmountFromStripe = (amount: number): number => {
  return amount / 100;
};