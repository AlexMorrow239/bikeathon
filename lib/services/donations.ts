import type Stripe from 'stripe';
import prisma from '@/lib/prisma';
import { formatAmountFromStripe } from '@/lib/stripe-server';
import { createLogger } from '@/lib/log';

const log = createLogger('donations');

export type DonationResult =
  | { status: 'created'; donationId: number; athleteId: number; amount: number }
  | { status: 'already_processed'; paymentIntentId: string }
  | { status: 'invalid'; reason: string };

export async function processDonationSucceeded(
  paymentIntent: Stripe.PaymentIntent
): Promise<DonationResult> {
  const athleteIdStr = paymentIntent.metadata?.athlete_id;
  if (!athleteIdStr) {
    return { status: 'invalid', reason: 'Missing athlete_id in metadata' };
  }

  const athleteId = parseInt(athleteIdStr, 10);
  if (isNaN(athleteId)) {
    return { status: 'invalid', reason: 'athlete_id metadata is not a valid integer' };
  }

  const amount = formatAmountFromStripe(paymentIntent.amount);
  const donorName = paymentIntent.metadata?.donor_name || undefined;

  const existing = await prisma.donation.findUnique({
    where: { stripePaymentIntentId: paymentIntent.id },
  });
  if (existing) {
    log.info('Idempotent skip: donation already exists', {
      paymentIntentId: paymentIntent.id,
    });
    return { status: 'already_processed', paymentIntentId: paymentIntent.id };
  }

  const result = await prisma.$transaction(async (tx) => {
    const donation = await tx.donation.create({
      data: {
        amount,
        stripePaymentIntentId: paymentIntent.id,
        athleteId,
        donorName,
      },
    });

    const athlete = await tx.athlete.update({
      where: { id: athleteId },
      data: { totalRaised: { increment: amount } },
      select: { id: true, name: true, teamId: true },
    });

    if (athlete.teamId) {
      await tx.team.update({
        where: { id: athlete.teamId },
        data: { totalRaised: { increment: amount } },
      });
    }

    return { donation, athlete };
  });

  log.info('Donation processed', {
    donationId: result.donation.id,
    athleteId,
    athleteName: result.athlete.name,
    amount,
  });

  return {
    status: 'created',
    donationId: result.donation.id,
    athleteId,
    amount,
  };
}
