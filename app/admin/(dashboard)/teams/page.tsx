import Link from 'next/link';
import prisma from '@/lib/prisma';
import { formatCurrency } from '@/lib/utils';
import ErrorMessage from '@/components/ErrorMessage';
import DeleteRowButton from '@/app/admin/_components/DeleteRowButton';
import { deleteTeamAction } from './actions';

export const metadata = {
  title: 'Admin · Teams',
};

export default async function AdminTeamsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  const teams = await prisma.team.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { athletes: true } } },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-gray-900">Teams</h1>
        <Link
          href="/admin/teams/new"
          className="inline-flex items-center justify-center rounded bg-primary-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-600"
        >
          Add team
        </Link>
      </div>

      {error ? <ErrorMessage message={error} /> : null}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-600">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Color</th>
              <th className="px-4 py-2 text-right">Athletes</th>
              <th className="px-4 py-2 text-right">Total raised</th>
              <th className="px-4 py-2"></th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {teams.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                  No teams yet.
                </td>
              </tr>
            ) : (
              teams.map((t) => (
                <tr key={t.id}>
                  <td className="px-4 py-2 font-medium text-gray-900">
                    {t.name}
                  </td>
                  <td className="px-4 py-2">
                    <span className="inline-flex items-center gap-2">
                      <span
                        className="inline-block h-4 w-4 rounded border border-gray-200"
                        style={{ backgroundColor: t.color }}
                      />
                      <span className="font-mono text-xs text-gray-600">
                        {t.color}
                      </span>
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">
                    {t._count.athletes}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">
                    {formatCurrency(t.totalRaised.toString())}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <Link
                      href={`/admin/teams/${t.id}`}
                      className="text-primary-600 hover:underline"
                    >
                      Edit
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <DeleteRowButton
                      action={deleteTeamAction.bind(null, t.id)}
                      confirmMessage={`Delete ${t.name}? This cannot be undone.`}
                      label={`Delete ${t.name}`}
                      disabledReason={
                        t._count.athletes > 0
                          ? `Cannot delete: ${t._count.athletes} athlete(s) still on this team`
                          : undefined
                      }
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
