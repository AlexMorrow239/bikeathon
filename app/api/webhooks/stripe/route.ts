import prisma from '@/lib/prisma';
import { constructWebhookEvent, formatAmountFromStripe } from '@/lib/stripe-server';
import Decimal from 'decimal.js';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

// Route segment config for Vercel
export const runtime = 'nodejs'; // Explicitly use Node.js runtime (required for Stripe webhook signature verification)
export const maxDuration = 30; // Maximum function duration in seconds
export const dynamic = 'force-dynamic'; // Disable caching for webhooks
export const preferredRegion = 'auto'; // Let Vercel choose optimal region

// Handle OPTIONS for CORS preflight (some environments require this)
export async function OPTIONS() {
  console.log('[Stripe Webhook] OPTIONS request received');
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Allow': 'POST, OPTIONS',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'stripe-signature, content-type',
    },
  });
}

// Stripe requires raw body for webhook signature verification
export async function POST(req: Request) {
  console.log('[Stripe Webhook] POST request received');

  // Log request details for debugging
  const url = new URL(req.url);
  console.log('[Stripe Webhook] Request URL:', url.pathname);
  console.log('[Stripe Webhook] Request method:', req.method);
  // Get headers
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');
  const contentType = headersList.get('content-type');

  console.log('[Stripe Webhook] Headers received:', {
    'stripe-signature': signature ? 'Present' : 'Missing',
    'content-type': contentType,
    'all-headers': Array.from(headersList.entries()).map(([key, value]) => ({
      key,
      value: key === 'stripe-signature' ? 'REDACTED' : value
    }))
  });

  // Read body
  let body: string;
  try {
    body = await req.text();
    console.log('[Stripe Webhook] Body length:', body.length);
    console.log('[Stripe Webhook] Body preview (first 100 chars):', body.substring(0, 100));
  } catch (error) {
    console.error('[Stripe Webhook] Error reading body:', error);
    return NextResponse.json(
      {
        error: 'Failed to read request body',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 400 }
    );
  }

  if (!signature) {
    console.error('[Stripe Webhook] Missing stripe-signature header');
    return NextResponse.json(
      {
        error: 'Missing stripe-signature header',
        message: 'Webhook requests must include a stripe-signature header',
        receivedHeaders: Array.from(headersList.keys())
      },
      { status: 400 }
    );
  }

  // Check webhook secret
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('[Stripe Webhook] Missing STRIPE_WEBHOOK_SECRET environment variable');
    return NextResponse.json(
      {
        error: 'Server configuration error',
        message: 'STRIPE_WEBHOOK_SECRET is not configured'
      },
      { status: 500 }
    );
  }

  console.log('[Stripe Webhook] Webhook secret configured:', webhookSecret ? 'Yes' : 'No');
  console.log('[Stripe Webhook] Webhook secret starts with:', webhookSecret.substring(0, 8) + '...');

  let event;

  try {
    event = constructWebhookEvent(body, signature, webhookSecret);
    console.log('[Stripe Webhook] Event constructed successfully:', {
      id: event.id,
      type: event.type,
      created: new Date(event.created * 1000).toISOString()
    });
  } catch (err) {
    console.error('[Stripe Webhook] Signature verification failed:', err);
    return NextResponse.json(
      {
        error: 'Invalid signature',
        message: 'Webhook signature verification failed',
        details: err instanceof Error ? err.message : 'Unknown error'
      },
      { status: 400 }
    );
  }

  // Handle the event
  console.log('[Stripe Webhook] Processing event type:', event.type);

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        console.log('[Stripe Webhook] Payment intent details:', {
          id: paymentIntent.id,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          status: paymentIntent.status,
          metadata: paymentIntent.metadata
        });

        // Validate metadata
        if (!paymentIntent.metadata || !paymentIntent.metadata.athlete_id) {
          console.error('[Stripe Webhook] Missing athlete_id in metadata');
          return NextResponse.json(
            {
              error: 'Missing metadata',
              message: 'Payment intent is missing required athlete_id metadata',
              received: true  // Still acknowledge to Stripe
            },
            { status: 200 }
          );
        }

        const amount = formatAmountFromStripe(paymentIntent.amount);
        const athleteId = parseInt(paymentIntent.metadata.athlete_id);

        console.log('[Stripe Webhook] Processing donation:', {
          amount,
          athleteId,
          paymentIntentId: paymentIntent.id
        });

        // Check if donation already exists (idempotency)
        const existingDonation = await prisma.donation.findUnique({
          where: { stripePaymentIntentId: paymentIntent.id },
        });

        if (existingDonation) {
          console.log('[Stripe Webhook] Donation already processed:', paymentIntent.id);
          return NextResponse.json({ received: true, status: 'already_processed' });
        }

        // Use transaction to ensure data consistency
        try {
          await prisma.$transaction(async (tx) => {
            console.log('[Stripe Webhook] Starting database transaction');

            // Create donation record
            const donation = await tx.donation.create({
              data: {
                amount: new Decimal(amount),
                stripePaymentIntentId: paymentIntent.id,
                athleteId: athleteId,
              },
            });
            console.log('[Stripe Webhook] Donation created:', donation.id);

            // Update athlete's total raised
            const updatedAthlete = await tx.athlete.update({
              where: { id: athleteId },
              data: {
                totalRaised: {
                  increment: amount,
                },
              },
            });
            console.log('[Stripe Webhook] Athlete updated:', {
              id: updatedAthlete.id,
              name: updatedAthlete.name,
              newTotal: updatedAthlete.totalRaised
            });

            // Get athlete's team ID and update team total
            const athlete = await tx.athlete.findUnique({
              where: { id: athleteId },
              select: { teamId: true, name: true },
            });

            if (athlete && athlete.teamId) {
              const updatedTeam = await tx.team.update({
                where: { id: athlete.teamId },
                data: {
                  totalRaised: {
                    increment: amount,
                  },
                },
              });
              console.log('[Stripe Webhook] Team updated:', {
                id: updatedTeam.id,
                name: updatedTeam.name,
                newTotal: updatedTeam.totalRaised
              });
            } else {
              console.warn('[Stripe Webhook] No team found for athlete:', athleteId);
            }

            console.log(`[Stripe Webhook] SUCCESS: Donation processed - $${amount} for athlete ${athlete?.name} (ID: ${athleteId})`);
          });
        } catch (txError) {
          console.error('[Stripe Webhook] Transaction failed:', txError);
          throw txError;  // Re-throw to be caught by outer try-catch
        }

        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        console.log('[Stripe Webhook] Payment failed:', {
          id: paymentIntent.id,
          amount: paymentIntent.amount,
          error: paymentIntent.last_payment_error,
          metadata: paymentIntent.metadata
        });
        // You could notify the athlete or admin about the failed payment
        break;
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
        console.log('[Stripe Webhook] Event data:', JSON.stringify(event.data, null, 2));
    }

    console.log('[Stripe Webhook] Webhook processed successfully');
    return NextResponse.json({
      received: true,
      eventType: event.type,
      eventId: event.id,
      status: 'success'
    });
  } catch (error) {
    console.error('[Stripe Webhook] Processing error:', {
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : error
    });

    // Detailed error response for debugging
    return NextResponse.json({
      received: true,  // Still acknowledge to Stripe
      error: 'Processing failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      eventType: event?.type,
      eventId: event?.id,
      status: 'error_processed'
    }, { status: 200 });  // Return 200 to prevent Stripe retries during debugging
  }
}
