import prisma from '@/lib/prisma';
import { paymentIntentSchema } from '@/lib/api/schemas';
import { error, ok, validationError } from '@/lib/api/responses';
import { formatAmountForStripe, stripe } from '@/lib/stripe-server';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = paymentIntentSchema.safeParse(body);
    if (!parsed.success) return validationError(parsed.error);
    const { amount, athleteId, donorName } = parsed.data;

    const athlete = await prisma.athlete.findUnique({
      where: { id: athleteId },
      select: { id: true, name: true },
    });
    if (!athlete) {
      return error(404, 'Selected athlete not found. Please refresh the page and try again.');
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: formatAmountForStripe(amount),
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      metadata: {
        athlete_id: athleteId.toString(),
        athlete_name: athlete.name,
        ...(donorName && { donor_name: donorName }),
      },
      description: `Donation for ${athlete.name} - Bikeathon Fundraiser`,
    });

    return ok({
      client_secret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.id,
      amount,
    });
  } catch (err) {
    console.error('Error creating payment intent:', err);
    if (err instanceof Error && err.message.toLowerCase().includes('stripe')) {
      return error(503, 'Payment service temporarily unavailable. Please try again in a moment.');
    }
    return error(500, 'Unable to process your donation. Please try again or contact support.');
  }
}
