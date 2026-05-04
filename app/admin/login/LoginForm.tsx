'use client';

import { useActionState } from 'react';
import ErrorMessage from '@/components/ErrorMessage';
import { ADMIN_INPUT_CLASS } from '@/app/admin/_components/AdminFormField';
import SubmitButton from '@/app/admin/_components/SubmitButton';
import { loginAction, type LoginActionState } from './actions';

export default function LoginForm({ next }: { next: string }) {
  const [state, formAction] = useActionState<LoginActionState | null, FormData>(
    loginAction,
    null,
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Admin password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoFocus
          autoComplete="current-password"
          className={ADMIN_INPUT_CLASS}
        />
      </div>
      {state?.error ? <ErrorMessage message={state.error} /> : null}
      <SubmitButton pendingLabel="Signing in…" fullWidth>
        Sign in
      </SubmitButton>
    </form>
  );
}
