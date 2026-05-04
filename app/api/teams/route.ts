import prisma from '@/lib/prisma';
import { serializeTeam } from '@/lib/api/serializers';
import { ok, error } from '@/lib/api/responses';

export async function GET() {
  try {
    const teams = await prisma.team.findMany({
      orderBy: { totalRaised: 'desc' },
      include: {
        _count: { select: { athletes: true } },
        athletes: { select: { id: true, name: true, totalRaised: true } },
      },
    });
    return ok(teams.map(serializeTeam));
  } catch (e) {
    console.error('Error fetching teams:', e);
    return error(500, 'Failed to fetch teams');
  }
}
