'use client';

import { useActionState } from 'react';
import AdminFormField, {
  ADMIN_INPUT_CLASS,
} from '@/app/admin/_components/AdminFormField';
import SubmitButton from '@/app/admin/_components/SubmitButton';
import ErrorMessage from '@/components/ErrorMessage';
import {
  updateAthleteAction,
  type AthleteFormState,
} from '../actions';

interface TeamOption {
  id: number;
  name: string;
}

interface AthleteValues {
  id: number;
  name: string;
  slug: string;
  bio: string | null;
  photoUrl: string | null;
  goal: string;
  milesGoal: number;
  teamId: number;
}

export default function AthleteEditForm({
  athlete,
  teams,
}: {
  athlete: AthleteValues;
  teams: TeamOption[];
}) {
  const action = updateAthleteAction.bind(null, athlete.id);
  const [state, formAction] = useActionState<AthleteFormState | null, FormData>(
    action,
    null,
  );
  const fieldError = (name: string) => state?.fieldErrors?.[name];

  return (
    <form action={formAction} className="space-y-4">
      {state?.error ? <ErrorMessage message={state.error} /> : null}

      <AdminFormField label="Name" name="name" required error={fieldError('name')}>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={athlete.name}
          className={ADMIN_INPUT_CLASS}
        />
      </AdminFormField>

      <AdminFormField label="Slug" name="slug" required error={fieldError('slug')}>
        <input
          id="slug"
          name="slug"
          type="text"
          required
          pattern="[a-z0-9-]+"
          defaultValue={athlete.slug}
          className={ADMIN_INPUT_CLASS}
        />
      </AdminFormField>

      <AdminFormField label="Team" name="teamId" required error={fieldError('teamId')}>
        <select
          id="teamId"
          name="teamId"
          required
          defaultValue={String(athlete.teamId)}
          className={ADMIN_INPUT_CLASS}
        >
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
          defaultValue={athlete.bio ?? ''}
          className={ADMIN_INPUT_CLASS}
        />
      </AdminFormField>

      <AdminFormField
        label="Photo URL"
        name="photoUrl"
        error={fieldError('photoUrl')}
      >
        <input
          id="photoUrl"
          name="photoUrl"
          type="url"
          defaultValue={athlete.photoUrl ?? ''}
          className={ADMIN_INPUT_CLASS}
        />
      </AdminFormField>

      <div className="grid grid-cols-2 gap-4">
        <AdminFormField label="Goal ($)" name="goal" error={fieldError('goal')}>
          <input
            id="goal"
            name="goal"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            defaultValue={athlete.goal}
            className={ADMIN_INPUT_CLASS}
          />
        </AdminFormField>

        <AdminFormField
          label="Miles goal"
          name="milesGoal"
          error={fieldError('milesGoal')}
        >
          <input
            id="milesGoal"
            name="milesGoal"
            type="number"
            inputMode="numeric"
            step="1"
            min="1"
            defaultValue={athlete.milesGoal}
            className={ADMIN_INPUT_CLASS}
          />
        </AdminFormField>
      </div>

      <div className="pt-2">
        <SubmitButton pendingLabel="Saving…">Save changes</SubmitButton>
      </div>
    </form>
  );
}
