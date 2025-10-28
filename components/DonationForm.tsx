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

const PRESET_AMOUNTS = [25, 50, 100, 250];

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
      setError('Please enter a valid amount');
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
        throw new Error('Failed to create payment intent');
      }

      const { client_secret } = await response.json();

      // Confirm payment with Stripe
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      const result = await stripe.confirmCardPayment(client_secret, {
        payment_method: {
          card: cardElement,
        },
      });

      if (result.error) {
        setError(result.error.message || 'Payment failed');
      } else if (result.paymentIntent.status === 'succeeded') {
        // Redirect to thank you page
        router.push(
          `/thank-you?amount=${amount}&athlete=${encodeURIComponent(athleteName)}&miles=${dollarsToMiles(amount)}`
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
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
              className={`p-3 border rounded ${
                amount === preset && !isCustom
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300'
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
            className="w-full p-3 border rounded"
            min="1"
            step="1"
          />
        </div>
      </div>

      {/* Miles Display */}
      {amount > 0 && (
        <div className="p-3 bg-green-50 border border-green-300 rounded">
          <p className="text-green-800">
            Your ${formatCurrency(amount)} donation = {dollarsToMiles(amount)} miles!
          </p>
        </div>
      )}

      {/* Card Element */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Card Information
        </label>
        <div className="p-3 border rounded">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  '::placeholder': {
                    color: '#aab7c4',
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
        className={`w-full p-3 rounded font-medium ${
          loading || !stripe || amount < 1
            ? 'bg-gray-300 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {loading ? <LoadingSpinner /> : `Donate ${formatCurrency(amount)}`}
      </button>

      {/* Test Card Info */}
      <div className="text-xs text-gray-500">
        <p>Test card: 4242 4242 4242 4242</p>
        <p>Use any future date and any 3-digit CVC</p>
      </div>
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
