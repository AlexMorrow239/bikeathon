'use client';

import { useFormStatus } from 'react-dom';

interface SubmitButtonProps {
  children: React.ReactNode;
  pendingLabel?: string;
  fullWidth?: boolean;
}

export default function SubmitButton({
  children,
  pendingLabel,
  fullWidth = false,
}: SubmitButtonProps) {
  const { pending } = useFormStatus();
  const widthClass = fullWidth ? 'w-full' : '';
  return (
    <button
      type="submit"
      disabled={pending}
      className={`inline-flex items-center justify-center rounded bg-primary-500 px-4 py-2 font-medium text-white hover:bg-primary-600 disabled:opacity-60 disabled:cursor-not-allowed ${widthClass}`.trim()}
    >
      {pending ? (pendingLabel ?? 'Working…') : children}
    </button>
  );
}
