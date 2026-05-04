'use client';

import { useEffect } from 'react';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Admin error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow p-6 space-y-3">
        <h1 className="text-lg font-semibold text-gray-900">
          Something went wrong
        </h1>
        <p className="text-sm text-gray-600">
          An error occurred in the admin area. Try again, or contact whoever
          maintains this if it persists.
        </p>
        {error?.digest ? (
          <p className="text-xs text-gray-400 font-mono">
            digest: {error.digest}
          </p>
        ) : null}
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center justify-center rounded bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
