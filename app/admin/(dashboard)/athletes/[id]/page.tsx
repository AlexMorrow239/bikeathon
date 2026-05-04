import Link from 'next/link';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import AthleteEditForm from './AthleteEditForm';

export const metadata = {
  title: 'Admin · Edit athlete',
};

export default async function EditAthletePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const athleteId = parseInt(id, 10);
  if (isNaN(athleteId)) notFound();

  const [athlete, teams] = await Promise.all([
    prisma.athlete.findUnique({
      where: { id: athleteId },
      include: { team: true },
    }),
    prisma.team.findMany({ orderBy: { name: 'asc' } }),
  ]);

  if (!athlete) notFound();

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
          Edit {athlete.name}
        </h1>
        <p className="text-sm text-gray-500">
          Public page: <code>/donate/{athlete.slug}</code>
        </p>
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <AthleteEditForm
          athlete={{
            id: athlete.id,
            name: athlete.name,
            slug: athlete.slug,
            bio: athlete.bio,
            photoUrl: athlete.photoUrl,
            goal: athlete.goal.toString(),
            milesGoal: athlete.milesGoal,
            teamId: athlete.teamId,
          }}
          teams={teams.map((t) => ({ id: t.id, name: t.name }))}
        />
      </div>
    </div>
  );
}
