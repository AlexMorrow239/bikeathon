import Link from 'next/link';
import prisma from '@/lib/prisma';
import { formatCurrency } from '@/lib/utils';

export const metadata = {
  title: 'Admin · Teams',
};

export default async function AdminTeamsPage() {
  const teams = await prisma.team.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { athletes: true } } },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-gray-900">Teams</h1>

      <p className="text-sm text-gray-600">
        Team creation isn’t available in the dashboard yet — edit{' '}
        <code>prisma/seed-data.json</code> and run{' '}
        <code>bun run db:seed</code> to add a team.
      </p>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-600">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Color</th>
              <th className="px-4 py-2 text-right">Athletes</th>
              <th className="px-4 py-2 text-right">Total raised</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {teams.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
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
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
