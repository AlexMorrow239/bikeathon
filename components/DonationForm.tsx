'use client';

import ErrorMessage from '@/components/ErrorMessage';
import LoadingSpinner from '@/components/LoadingSpinner';
import { getStripe } from '@/lib/stripe-client';
import { dollarsToMiles, formatCurrency } from '@/lib/utils';
import {
  CardElement,
  Elements,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface DonationFormProps {
  athleteId: number;
  athleteName: string;
}

const PRESET_AMOUNTS = [2, 5, 10, 20];

function DonationFormContent({ athleteId, athleteName }: DonationFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();

  const [amount, setAmount] = useState(50);
  const [customAmount, setCustomAmount] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAmountSelect = (value: number) => {
    setAmount(value);
    setIsCustom(false);
    setCustomAmount('');
    setError(null);
  };

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomAmount(value);
    setIsCustom(true);
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue > 0) {
      setAmount(numValue);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    if (amount < 1) {
      setError('Please enter a donation amount of at least $1');
      return;
    }

    if (amount > 999999) {
      setError('Donation amount exceeds the maximum allowed ($999,999)');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create payment intent
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          athleteId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        if (errorData?.error) {
          throw new Error(errorData.error);
        }
        throw new Error('Unable to process donation. Please try again.');
      }

      const { client_secret } = await response.json();

      // Confirm payment with Stripe
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Unable to load payment form. Please refresh the page and try again.');
      }

      const result = await stripe.confirmCardPayment(client_secret, {
        payment_method: {
          card: cardElement,
        },
      });

      if (result.error) {
        // Provide user-friendly error messages for common Stripe errors
        let errorMessage = result.error.message || 'Payment failed';

        // Make common error messages more user-friendly
        if (errorMessage.includes('card was declined')) {
          errorMessage = 'Your card was declined. Please check your card details or try a different payment method.';
        } else if (errorMessage.includes('incorrect_number')) {
          errorMessage = 'The card number is incorrect. Please check and try again.';
        } else if (errorMessage.includes('invalid_expiry')) {
          errorMessage = 'The card expiry date is invalid. Please check and try again.';
        } else if (errorMessage.includes('incorrect_cvc')) {
          errorMessage = 'The security code (CVC) is incorrect. Please check and try again.';
        } else if (errorMessage.includes('insufficient_funds')) {
          errorMessage = 'Your card has insufficient funds. Please try a different payment method.';
        } else if (errorMessage.includes('processing_error')) {
          errorMessage = 'There was an issue processing your payment. Please try again in a moment.';
        }

        setError(errorMessage);
      } else if (result.paymentIntent.status === 'succeeded') {
        // Redirect to thank you page
        router.push(
          `/thank-you?amount=${amount}&athlete=${encodeURIComponent(athleteName)}&miles=${dollarsToMiles(amount)}`
        );
      }
    } catch (err) {
      // Handle network errors and other issues
      if (err instanceof Error) {
        if (err.message.includes('fetch')) {
          setError('Connection error. Please check your internet connection and try again.');
        } else {
          setError(err.message);
        }
      } else {
        setError('Something went wrong. Please try again or contact support.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Amount Selection */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Select Amount
        </label>
        <div className="grid grid-cols-2 gap-2 mb-3">
          {PRESET_AMOUNTS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => handleAmountSelect(preset)}
              className={`p-3 border rounded transition-colors ${
                amount === preset && !isCustom
                  ? 'border-primary-500 bg-primary-50 text-primary-700 font-medium'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              ${preset}
            </button>
          ))}
        </div>
        <div>
          <input
            type="number"
            placeholder="Custom amount"
            value={customAmount}
            onChange={handleCustomAmountChange}
            className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
            min="1"
            step="1"
          />
        </div>
      </div>

      {/* Miles Display */}
      {amount > 0 && (
        <div className="p-3 bg-success-50 border border-success-300 rounded">
          <p className="text-success-700 font-medium">
            Your {formatCurrency(amount)} donation = {dollarsToMiles(amount)} miles!
          </p>
        </div>
      )}

      {/* Card Element */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Card Information
        </label>
        <div className="p-3 border border-gray-300 rounded focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-primary-500 transition-all">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#111827',
                  '::placeholder': {
                    color: '#9ca3af',
                  },
                },
              },
            }}
          />
        </div>
      </div>

      {/* Error Message */}
      {error && <ErrorMessage message={error} />}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!stripe || loading || amount < 1}
        className={`w-full p-3 rounded font-medium transition-colors ${
          loading || !stripe || amount < 1
            ? 'bg-gray-300 cursor-not-allowed text-gray-500'
            : 'bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700'
        }`}
      >
        {loading ? <LoadingSpinner /> : `Donate ${formatCurrency(amount)}`}
      </button>
    </form>
  );
}

// Main component with Stripe Elements provider
export function DonationForm({ athleteId, athleteName }: DonationFormProps) {
  const stripePromise = getStripe();

  return (
    <Elements stripe={stripePromise}>
      <DonationFormContent athleteId={athleteId} athleteName={athleteName} />
    </Elements>
  );
}
