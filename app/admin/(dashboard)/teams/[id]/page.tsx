import Link from 'next/link';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import TeamEditForm from './TeamEditForm';

export const metadata = {
  title: 'Admin · Edit team',
};

export default async function EditTeamPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const teamId = parseInt(id, 10);
  if (isNaN(teamId)) notFound();

  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) notFound();

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
          Edit {team.name}
        </h1>
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <TeamEditForm
          team={{ id: team.id, name: team.name, color: team.color }}
        />
      </div>
    </div>
  );
}
