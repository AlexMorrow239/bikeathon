'use client';

import ErrorMessage from '@/components/ErrorMessage';
import LoadingSpinner from '@/components/LoadingSpinner';
import {
  DEFAULT_DONATION_AMOUNT,
  MAX_DONATION_AMOUNT,
  MIN_DONATION_AMOUNT,
} from '@/lib/config';
import { useStripePayment } from '@/lib/payment/use-stripe-payment';
import { getStripe } from '@/lib/stripe-client';
import { formatCurrency } from '@/lib/utils';
import { Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { useEffect, useState } from 'react';

interface DonationFormProps {
  athleteId: number;
  athleteName: string;
}

const PRESET_AMOUNTS = [2, 5, 10, 20];
const ELEMENTS_UPDATE_DEBOUNCE_MS = 250;

function DonationFormFields({ athleteId, athleteName }: DonationFormProps) {
  const elements = useElements();
  const { submit, isLoading, error } = useStripePayment();

  const [amount, setAmount] = useState(DEFAULT_DONATION_AMOUNT);
  const [customAmount, setCustomAmount] = useState('');
  const [donorName, setDonorName] = useState('');

  const isCustom = customAmount !== '';

  useEffect(() => {
    if (!elements) return;
    if (amount < MIN_DONATION_AMOUNT || amount > MAX_DONATION_AMOUNT) return;
    const timer = setTimeout(() => {
      elements.update({ amount: Math.round(amount * 100) });
    }, ELEMENTS_UPDATE_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [elements, amount]);

  const handleAmountSelect = (value: number) => {
    setAmount(value);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomAmount(value);
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue > 0) {
      setAmount(numValue);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount < MIN_DONATION_AMOUNT || amount > MAX_DONATION_AMOUNT) return;
    submit({ amount, athleteId, athleteName, donorName });
  };

  const submitDisabled =
    isLoading || amount < MIN_DONATION_AMOUNT || amount > MAX_DONATION_AMOUNT;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Select Amount</label>
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

      <div>
        <label htmlFor="donor-name" className="block text-sm font-medium mb-2">
          Your Name (Optional)
        </label>
        <input
          id="donor-name"
          type="text"
          placeholder="Enter your name (leave blank to donate anonymously)"
          value={donorName}
          onChange={(e) => setDonorName(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
          maxLength={100}
        />
        <p className="text-xs text-gray-500 mt-1">
          Your name will be displayed with your donation
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Payment Details</label>
        <PaymentElement options={{ layout: 'tabs' }} />
      </div>

      {error && <ErrorMessage message={error} />}

      <button
        type="submit"
        disabled={submitDisabled}
        className={`w-full p-3 rounded font-medium transition-colors ${
          submitDisabled
            ? 'bg-gray-300 cursor-not-allowed text-gray-500'
            : 'bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700'
        }`}
      >
        {isLoading ? <LoadingSpinner /> : `Donate ${formatCurrency(amount)}`}
      </button>
    </form>
  );
}

export function DonationForm({ athleteId, athleteName }: DonationFormProps) {
  const stripePromise = getStripe();

  return (
    <Elements
      stripe={stripePromise}
      options={{
        mode: 'payment',
        amount: DEFAULT_DONATION_AMOUNT * 100,
        currency: 'usd',
      }}
    >
      <DonationFormFields athleteId={athleteId} athleteName={athleteName} />
    </Elements>
  );
}
