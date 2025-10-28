'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { formatCurrency } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { Suspense } from 'react';

function ThankYouContent() {
  const searchParams = useSearchParams();
  const [amount, setAmount] = useState<string | null>(null);
  const [athlete, setAthlete] = useState<string | null>(null);
  const [miles, setMiles] = useState<string | null>(null);

  useEffect(() => {
    // Get parameters from URL
    setAmount(searchParams.get('amount'));
    setAthlete(searchParams.get('athlete'));
    setMiles(searchParams.get('miles'));
  }, [searchParams]);

  if (!amount || !athlete || !miles) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-gray-900">Thank You!</h1>
          <p className="mb-6 text-gray-600">Your donation has been processed.</p>
          <Link href="/" className="text-primary-600 hover:text-primary-700 underline transition-colors">
            Return to homepage
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-gray-900">Thank You!</h1>

        <div className="mb-8 p-6 bg-success-50 border border-success-200 rounded-lg">
          <p className="text-2xl font-semibold mb-2 text-gray-900">
            You donated {formatCurrency(parseFloat(amount))}
          </p>
          <p className="text-xl text-success-700 font-medium">
            = {miles} miles for {decodeURIComponent(athlete)}!
          </p>
        </div>

        <p className="text-gray-600 mb-8">
          Your generous donation will help {decodeURIComponent(athlete)} reach their fundraising goal.
          Every mile counts!
        </p>

        <Link
          href="/"
          className="inline-block px-6 py-3 bg-secondary-500 text-white rounded-lg hover:bg-secondary-600 active:bg-secondary-700 transition-colors font-medium"
        >
          Return to Homepage
        </Link>
      </div>
    </div>
  );
}

export default function ThankYouPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p>Loading...</p>
        </div>
      </div>
    }>
      <ThankYouContent />
    </Suspense>
  );
}