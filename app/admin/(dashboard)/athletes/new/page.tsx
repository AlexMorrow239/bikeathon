import Link from 'next/link';
import prisma from '@/lib/prisma';
import AthleteCreateForm from './AthleteCreateForm';

export const metadata = {
  title: 'Admin · New athlete',
};

export default async function NewAthletePage() {
  const teams = await prisma.team.findMany({ orderBy: { name: 'asc' } });

  return (
    <div className="space-y-4 max-w-2xl">
      <div>
        <Link
          href="/admin/athletes"
          className="text-sm text-gray-500 hover:underline"
        >
          ← Athletes
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900 mt-1">
          New athlete
        </h1>
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <AthleteCreateForm
          teams={teams.map((t) => ({ id: t.id, name: t.name }))}
        />
      </div>
    </div>
  );
}
