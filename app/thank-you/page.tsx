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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Thank You!</h1>
          <p className="mb-6">Your donation has been processed.</p>
          <Link href="/" className="text-blue-600 underline">
            Return to homepage
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center max-w-md">
        <h1 className="text-3xl font-bold mb-6">Thank You! 🎉</h1>

        <div className="mb-8 p-6 bg-green-50 rounded-lg">
          <p className="text-2xl font-semibold mb-2">
            You donated {formatCurrency(parseFloat(amount))}
          </p>
          <p className="text-xl text-green-700">
            = {miles} miles for {decodeURIComponent(athlete)}!
          </p>
        </div>

        <p className="text-gray-600 mb-8">
          Your generous donation will help {decodeURIComponent(athlete)} reach their fundraising goal.
          Every mile counts!
        </p>

        <Link
          href="/"
          className="inline-block px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
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