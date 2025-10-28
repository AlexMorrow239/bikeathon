import prisma from '@/lib/prisma';
import { constructWebhookEvent, formatAmountFromStripe } from '@/lib/stripe';
import Decimal from 'decimal.js';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

// Stripe requires raw body for webhook signature verification
export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  let event;

  try {
    event = constructWebhookEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        const amount = formatAmountFromStripe(paymentIntent.amount);
        const athleteId = parseInt(paymentIntent.metadata.athlete_id);

        // Check if donation already exists (idempotency)
        const existingDonation = await prisma.donation.findUnique({
          where: { stripePaymentIntentId: paymentIntent.id },
        });

        if (existingDonation) {
          console.log('Donation already processed:', paymentIntent.id);
          return NextResponse.json({ received: true });
        }

        // Use transaction to ensure data consistency
        await prisma.$transaction(async (tx) => {
          // Create donation record
          await tx.donation.create({
            data: {
              amount: new Decimal(amount),
              stripePaymentIntentId: paymentIntent.id,
              athleteId: athleteId,
            },
          });

          // Update athlete's total raised
          await tx.athlete.update({
            where: { id: athleteId },
            data: {
              totalRaised: {
                increment: amount,
              },
            },
          });

          // Get athlete's team ID and update team total
          const athlete = await tx.athlete.findUnique({
            where: { id: athleteId },
            select: { teamId: true, name: true },
          });

          if (athlete) {
            await tx.team.update({
              where: { id: athlete.teamId },
              data: {
                totalRaised: {
                  increment: amount,
                },
              },
            });
          }

          console.log(`Donation processed: $${amount} for athlete ${athlete?.name} (ID: ${athleteId})`);
        });

        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        console.log('Payment failed:', paymentIntent.id);
        // You could notify the athlete or admin about the failed payment
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    // Return 200 to acknowledge receipt even if processing failed
    // Stripe will retry if we return an error
    return NextResponse.json({ received: true });
  }
}
