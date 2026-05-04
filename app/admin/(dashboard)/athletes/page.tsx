import Link from 'next/link';
import prisma from '@/lib/prisma';
import { formatCurrency } from '@/lib/utils';

export const metadata = {
  title: 'Admin · Athletes',
};

export default async function AdminAthletesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? '';

  const where = query
    ? {
        OR: [
          { name: { contains: query, mode: 'insensitive' as const } },
          { slug: { contains: query, mode: 'insensitive' as const } },
        ],
      }
    : {};

  const athletes = await prisma.athlete.findMany({
    where,
    include: { team: true },
    orderBy: { name: 'asc' },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-gray-900">Athletes</h1>
        <Link
          href="/admin/athletes/new"
          className="inline-flex items-center justify-center rounded bg-primary-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-600"
        >
          Add athlete
        </Link>
      </div>

      <form
        method="get"
        action="/admin/athletes"
        className="flex items-center gap-2"
      >
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Search by name or slug…"
          className="flex-1 max-w-md rounded border border-gray-300 px-3 py-1.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded bg-gray-200 px-3 py-1.5 text-sm font-medium text-gray-800 hover:bg-gray-300"
        >
          Search
        </button>
        {query ? (
          <Link
            href="/admin/athletes"
            className="text-sm text-gray-500 hover:underline"
          >
            Clear
          </Link>
        ) : null}
      </form>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-600">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Slug</th>
              <th className="px-4 py-2">Team</th>
              <th className="px-4 py-2 text-right">Raised</th>
              <th className="px-4 py-2 text-right">Goal</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {athletes.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                  {query ? 'No athletes match that search.' : 'No athletes yet.'}
                </td>
              </tr>
            ) : (
              athletes.map((a) => (
                <tr key={a.id}>
                  <td className="px-4 py-2 font-medium text-gray-900">
                    {a.name}
                  </td>
                  <td className="px-4 py-2 text-gray-600 font-mono text-xs">
                    {a.slug}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className="inline-flex items-center gap-1.5"
                      style={{ color: a.team.color }}
                    >
                      <span
                        className="inline-block h-2 w-2 rounded-full"
                        style={{ backgroundColor: a.team.color }}
                      />
                      {a.team.name}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">
                    {formatCurrency(a.totalRaised.toString())}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums text-gray-600">
                    {formatCurrency(a.goal.toString())}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <Link
                      href={`/admin/athletes/${a.id}`}
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
