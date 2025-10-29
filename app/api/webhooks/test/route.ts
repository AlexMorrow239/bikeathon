import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

// Test endpoint to debug webhook configuration
export async function GET(req: Request) {
  const headersList = await headers();
  const url = new URL(req.url);

  return NextResponse.json({
    message: 'Test webhook endpoint (GET)',
    method: req.method,
    url: url.pathname,
    headers: Array.from(headersList.entries()).map(([key, value]) => ({
      key,
      value: key.includes('key') || key.includes('secret') ? 'REDACTED' : value
    })),
    environment: {
      hasStripeSecret: !!process.env.STRIPE_SECRET_KEY,
      hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
      hasPublishableKey: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      webhookSecretPrefix: process.env.STRIPE_WEBHOOK_SECRET?.substring(0, 8) || 'NOT_SET'
    }
  });
}

export async function POST(req: Request) {
  const headersList = await headers();
  const url = new URL(req.url);
  let body;

  try {
    const text = await req.text();
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  } catch (error) {
    body = 'Failed to read body';
  }

  return NextResponse.json({
    message: 'Test webhook endpoint (POST)',
    method: req.method,
    url: url.pathname,
    headers: Array.from(headersList.entries()).map(([key, value]) => ({
      key,
      value: key.includes('key') || key.includes('secret') || key === 'stripe-signature' ? 'REDACTED' : value
    })),
    bodyType: typeof body,
    bodyLength: typeof body === 'string' ? body.length : JSON.stringify(body).length,
    bodyPreview: typeof body === 'string' ? body.substring(0, 100) : JSON.stringify(body).substring(0, 100),
    environment: {
      hasStripeSecret: !!process.env.STRIPE_SECRET_KEY,
      hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
      hasPublishableKey: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      webhookSecretPrefix: process.env.STRIPE_WEBHOOK_SECRET?.substring(0, 8) || 'NOT_SET'
    }
  });
}

// Handle other methods to debug 405 errors
export async function PUT(req: Request) {
  return NextResponse.json(
    { error: 'Method not allowed', method: 'PUT' },
    { status: 405, headers: { 'Allow': 'GET, POST' } }
  );
}

export async function DELETE(req: Request) {
  return NextResponse.json(
    { error: 'Method not allowed', method: 'DELETE' },
    { status: 405, headers: { 'Allow': 'GET, POST' } }
  );
}

export async function PATCH(req: Request) {
  return NextResponse.json(
    { error: 'Method not allowed', method: 'PATCH' },
    { status: 405, headers: { 'Allow': 'GET, POST' } }
  );
}
