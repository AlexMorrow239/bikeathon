import Link from 'next/link';
import prisma from '@/lib/prisma';
import { formatCurrency } from '@/lib/utils';

export const metadata = {
  title: 'Admin · Dashboard',
};

export default async function AdminDashboardPage() {
  const [athleteCount, teamCount, donationAgg] = await Promise.all([
    prisma.athlete.count(),
    prisma.team.count(),
    prisma.donation.aggregate({ _sum: { amount: true } }),
  ]);

  const totalRaised = donationAgg._sum.amount?.toString() ?? '0';

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Athletes" value={athleteCount.toString()} />
        <StatCard label="Teams" value={teamCount.toString()} />
        <StatCard label="Total raised" value={formatCurrency(totalRaised)} />
      </div>

      <div className="bg-white rounded-lg shadow p-4 space-y-2">
        <h2 className="text-sm font-medium text-gray-700 uppercase tracking-wide">
          Manage
        </h2>
        <ul className="space-y-1">
          <li>
            <Link
              href="/admin/athletes"
              className="text-primary-600 hover:underline"
            >
              Athletes →
            </Link>
          </li>
          <li>
            <Link
              href="/admin/teams"
              className="text-primary-600 hover:underline"
            >
              Teams →
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="text-xs uppercase tracking-wide text-gray-500">
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold text-gray-900">{value}</div>
    </div>
  );
}
