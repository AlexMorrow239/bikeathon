'use client';

import { useActionState } from 'react';
import AdminFormField, {
  ADMIN_INPUT_CLASS,
} from '@/app/admin/_components/AdminFormField';
import SubmitButton from '@/app/admin/_components/SubmitButton';
import ErrorMessage from '@/components/ErrorMessage';
import {
  createAthleteAction,
  type AthleteFormState,
} from '../actions';

interface TeamOption {
  id: number;
  name: string;
}

export default function AthleteCreateForm({ teams }: { teams: TeamOption[] }) {
  const [state, formAction] = useActionState<AthleteFormState | null, FormData>(
    createAthleteAction,
    null,
  );
  const fieldError = (name: string) => state?.fieldErrors?.[name];

  return (
    <form action={formAction} className="space-y-4">
      {state?.error ? <ErrorMessage message={state.error} /> : null}

      <AdminFormField label="Name" name="name" required error={fieldError('name')}>
        <input id="name" name="name" type="text" required className={ADMIN_INPUT_CLASS} />
      </AdminFormField>

      <AdminFormField
        label="Slug"
        name="slug"
        required
        hint="URL-friendly: lowercase letters, numbers, hyphens. Used in /donate/<slug>."
        error={fieldError('slug')}
      >
        <input
          id="slug"
          name="slug"
          type="text"
          required
          pattern="[a-z0-9-]+"
          className={ADMIN_INPUT_CLASS}
        />
      </AdminFormField>

      <AdminFormField label="Team" name="teamId" required error={fieldError('teamId')}>
        <select id="teamId" name="teamId" required className={ADMIN_INPUT_CLASS} defaultValue="">
          <option value="" disabled>
            Select a team…
          </option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </AdminFormField>

      <AdminFormField label="Bio" name="bio" error={fieldError('bio')}>
        <textarea
          id="bio"
          name="bio"
          rows={3}
          className={ADMIN_INPUT_CLASS}
        />
      </AdminFormField>

      <AdminFormField
        label="Photo URL"
        name="photoUrl"
        error={fieldError('photoUrl')}
      >
        <input id="photoUrl" name="photoUrl" type="url" className={ADMIN_INPUT_CLASS} />
      </AdminFormField>

      <div className="grid grid-cols-2 gap-4">
        <AdminFormField
          label="Goal ($)"
          name="goal"
          hint="Defaults to $200"
          error={fieldError('goal')}
        >
          <input
            id="goal"
            name="goal"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            className={ADMIN_INPUT_CLASS}
          />
        </AdminFormField>

        <AdminFormField
          label="Miles goal"
          name="milesGoal"
          hint="Defaults to 100"
          error={fieldError('milesGoal')}
        >
          <input
            id="milesGoal"
            name="milesGoal"
            type="number"
            inputMode="numeric"
            step="1"
            min="1"
            className={ADMIN_INPUT_CLASS}
          />
        </AdminFormField>
      </div>

      <div className="pt-2">
        <SubmitButton pendingLabel="Creating…">Create athlete</SubmitButton>
      </div>
    </form>
  );
}
