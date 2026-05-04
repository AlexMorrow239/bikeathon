import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { constructWebhookEvent } from '@/lib/stripe-server';
import { processDonationSucceeded } from '@/lib/services/donations';
import { createLogger } from '@/lib/log';

export const runtime = 'nodejs';
export const maxDuration = 30;
export const dynamic = 'force-dynamic';

const log = createLogger('stripe-webhook');

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get('stripe-signature');

  if (!signature) {
    log.warn('Missing stripe-signature header');
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    log.error('STRIPE_WEBHOOK_SECRET not configured');
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    event = constructWebhookEvent(body, signature, webhookSecret);
  } catch (err) {
    log.warn('Signature verification failed', {
      error: err instanceof Error ? err.message : 'unknown',
    });
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const result = await processDonationSucceeded(event.data.object);
        if (result.status === 'invalid') {
          log.warn('Skipped invalid donation event', {
            paymentIntentId: event.data.object.id,
            reason: result.reason,
          });
        }
        return NextResponse.json({ received: true, status: result.status });
      }
      case 'payment_intent.payment_failed': {
        log.info('Payment failed', { paymentIntentId: event.data.object.id });
        return NextResponse.json({ received: true });
      }
      default:
        log.info('Unhandled event type', { type: event.type });
        return NextResponse.json({ received: true });
    }
  } catch (err) {
    log.error('Event processing failed', {
      type: event.type,
      eventId: event.id,
      error: err instanceof Error ? err.message : 'unknown',
    });
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}
