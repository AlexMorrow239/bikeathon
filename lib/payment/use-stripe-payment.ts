'use client';

import { useElements, useStripe } from '@stripe/react-stripe-js';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { dollarsToMiles } from '@/lib/utils';

interface SubmitArgs {
  amount: number;
  athleteId: number;
  athleteName: string;
  donorName?: string;
}

export type PaymentStatus = 'idle' | 'submitting' | 'succeeded' | 'failed';

export function useStripePayment() {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [status, setStatus] = useState<PaymentStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const submit = async ({ amount, athleteId, athleteName, donorName }: SubmitArgs) => {
    if (!stripe || !elements) return;

    setStatus('submitting');
    setError(null);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message ?? 'Please review your payment details.');
      setStatus('failed');
      return;
    }

    let clientSecret: string;
    try {
      const res = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          athleteId,
          donorName: donorName?.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error ?? 'Unable to process donation. Please try again.');
        setStatus('failed');
        return;
      }
      const body = await res.json();
      if (typeof body?.client_secret !== 'string' || !body.client_secret) {
        setError('Unable to process donation. Please try again.');
        setStatus('failed');
        return;
      }
      clientSecret = body.client_secret;
    } catch {
      setError('Connection error. Please check your internet connection and try again.');
      setStatus('failed');
      return;
    }

    const successParams = new URLSearchParams({
      amount: amount.toString(),
      athlete: athleteName,
      miles: dollarsToMiles(amount).toString(),
    });
    if (donorName?.trim()) successParams.set('donor', donorName.trim());
    const returnUrl = `${window.location.origin}/thank-you?${successParams.toString()}`;

    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
      elements,
      clientSecret,
      confirmParams: { return_url: returnUrl },
      redirect: 'if_required',
    });

    if (confirmError) {
      setError(humanizeStripeError(confirmError));
      setStatus('failed');
      return;
    }

    if (paymentIntent?.status === 'succeeded') {
      setStatus('succeeded');
      router.push(`/thank-you?${successParams.toString()}`);
      return;
    }

    setError('Payment did not complete. Please try again.');
    setStatus('failed');
  };

  return { submit, status, error, isLoading: status === 'submitting' };
}

function humanizeStripeError(error: { code?: string; message?: string }): string {
  switch (error.code) {
    case 'card_declined':
      return 'Your card was declined. Please check your card details or try a different payment method.';
    case 'incorrect_number':
      return 'The card number is incorrect. Please check and try again.';
    case 'invalid_expiry_month':
    case 'invalid_expiry_year':
    case 'invalid_expiry_year_past':
      return 'The card expiry date is invalid. Please check and try again.';
    case 'incorrect_cvc':
    case 'invalid_cvc':
      return 'The security code (CVC) is incorrect. Please check and try again.';
    case 'insufficient_funds':
      return 'Your card has insufficient funds. Please try a different payment method.';
    case 'processing_error':
      return 'There was an issue processing your payment. Please try again in a moment.';
    default:
      return error.message ?? 'Payment failed. Please try again.';
  }
}
