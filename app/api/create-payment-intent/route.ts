import { NextResponse } from 'next/server';
import { stripe, formatAmountForStripe } from '@/lib/stripe';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { amount, athleteId } = await req.json();

    // Validate inputs
    if (!amount || !athleteId) {
      return NextResponse.json(
        { error: 'Missing required fields: amount and athleteId' },
        { status: 400 }
      );
    }

    if (amount < 1) {
      return NextResponse.json(
        { error: 'Amount must be at least $1' },
        { status: 400 }
      );
    }

    if (amount > 999999) {
      return NextResponse.json(
        { error: 'Amount exceeds maximum allowed' },
        { status: 400 }
      );
    }

    // Verify athlete exists
    const athlete = await prisma.athlete.findUnique({
      where: { id: athleteId },
      select: { id: true, name: true },
    });

    if (!athlete) {
      return NextResponse.json(
        { error: 'Athlete not found' },
        { status: 404 }
      );
    }

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: formatAmountForStripe(amount), // Convert dollars to cents
      currency: 'usd',
      metadata: {
        athlete_id: athleteId.toString(),
        athlete_name: athlete.name,
      },
      description: `Donation for ${athlete.name} - Bikeathon Fundraiser`,
    });

    return NextResponse.json({
      client_secret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.id,
      amount: amount,
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}