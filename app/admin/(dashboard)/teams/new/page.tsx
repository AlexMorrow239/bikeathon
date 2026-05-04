import Link from 'next/link';
import TeamCreateForm from './TeamCreateForm';

export const metadata = {
  title: 'Admin · New team',
};

export default function NewTeamPage() {
  return (
    <div className="space-y-4 max-w-xl">
      <div>
        <Link
          href="/admin/teams"
          className="text-sm text-gray-500 hover:underline"
        >
          ← Teams
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900 mt-1">
          New team
        </h1>
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <TeamCreateForm />
      </div>
    </div>
  );
}
