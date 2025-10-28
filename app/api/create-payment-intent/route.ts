import { NextResponse } from 'next/server';
import { stripe, formatAmountForStripe } from '@/lib/stripe-server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid request data. Please check your input and try again.' },
        { status: 400 }
      );
    }

    const { amount, athleteId } = body;

    // Validate inputs
    if (!amount || !athleteId) {
      return NextResponse.json(
        { error: 'Missing required information. Please select an amount and athlete.' },
        { status: 400 }
      );
    }

    // Validate amount is a number
    const numAmount = Number(amount);
    if (isNaN(numAmount)) {
      return NextResponse.json(
        { error: 'Invalid donation amount. Please enter a valid number.' },
        { status: 400 }
      );
    }

    if (numAmount < 1) {
      return NextResponse.json(
        { error: 'Donation amount must be at least $1.' },
        { status: 400 }
      );
    }

    if (numAmount > 999999) {
      return NextResponse.json(
        { error: 'Donation amount exceeds the maximum allowed ($999,999).' },
        { status: 400 }
      );
    }

    // Validate athleteId is a number
    const numAthleteId = Number(athleteId);
    if (isNaN(numAthleteId)) {
      return NextResponse.json(
        { error: 'Invalid athlete selection. Please refresh the page and try again.' },
        { status: 400 }
      );
    }

    // Verify athlete exists
    const athlete = await prisma.athlete.findUnique({
      where: { id: numAthleteId },
      select: { id: true, name: true },
    });

    if (!athlete) {
      return NextResponse.json(
        { error: 'Selected athlete not found. Please refresh the page and try again.' },
        { status: 404 }
      );
    }

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: formatAmountForStripe(numAmount), // Convert dollars to cents
      currency: 'usd',
      metadata: {
        athlete_id: numAthleteId.toString(),
        athlete_name: athlete.name,
      },
      description: `Donation for ${athlete.name} - Bikeathon Fundraiser`,
    });

    return NextResponse.json({
      client_secret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.id,
      amount: numAmount,
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);

    // Check for Stripe-specific errors
    if (error instanceof Error) {
      if (error.message.includes('stripe')) {
        return NextResponse.json(
          { error: 'Payment service temporarily unavailable. Please try again in a moment.' },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Unable to process your donation. Please try again or contact support.' },
      { status: 500 }
    );
  }
}