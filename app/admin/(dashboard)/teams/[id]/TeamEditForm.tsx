'use client';

import { useActionState, useState } from 'react';
import AdminFormField, {
  ADMIN_INPUT_CLASS,
} from '@/app/admin/_components/AdminFormField';
import SubmitButton from '@/app/admin/_components/SubmitButton';
import ErrorMessage from '@/components/ErrorMessage';
import { updateTeamAction, type TeamFormState } from '../actions';

interface TeamValues {
  id: number;
  name: string;
  color: string;
}

export default function TeamEditForm({ team }: { team: TeamValues }) {
  const action = updateTeamAction.bind(null, team.id);
  const [state, formAction] = useActionState<TeamFormState | null, FormData>(
    action,
    null,
  );
  const [color, setColor] = useState(team.color);
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
          defaultValue={team.name}
          className={ADMIN_INPUT_CLASS}
        />
      </AdminFormField>

      <AdminFormField
        label="Color"
        name="color"
        required
        hint="Hex color, e.g. #f47321"
        error={fieldError('color')}
      >
        <div className="flex items-center gap-3">
          <input
            id="color"
            name="color"
            type="color"
            required
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-10 w-16 cursor-pointer rounded border border-gray-300"
          />
          <span className="font-mono text-sm text-gray-600">{color}</span>
        </div>
      </AdminFormField>

      <div className="pt-2">
        <SubmitButton pendingLabel="Saving…">Save changes</SubmitButton>
      </div>
    </form>
  );
}
