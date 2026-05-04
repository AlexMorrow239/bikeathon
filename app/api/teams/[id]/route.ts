import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAdminPassword } from '@/app/api/utils/auth';
import { teamUpdateSchema } from '@/lib/api/schemas';
import { serializeTeam } from '@/lib/api/serializers';
import { ok, error, validationError } from '@/lib/api/responses';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const teamId = parseInt(id);
    if (isNaN(teamId)) return error(400, 'Invalid team ID');

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        athletes: {
          select: { id: true, name: true, slug: true, totalRaised: true, goal: true },
        },
      },
    });
    if (!team) return error(404, 'Team not found');

    return ok(serializeTeam(team));
  } catch (e) {
    console.error('Error fetching team:', e);
    return error(500, 'Failed to fetch team');
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = verifyAdminPassword(request);
    if (authResult !== true) return authResult;

    const { id } = await params;
    const teamId = parseInt(id);
    if (isNaN(teamId)) return error(400, 'Invalid team ID');

    const existing = await prisma.team.findUnique({ where: { id: teamId } });
    if (!existing) return error(404, 'Team not found');

    const body = await request.json().catch(() => null);
    const parsed = teamUpdateSchema.safeParse(body);
    if (!parsed.success) return validationError(parsed.error);
    const data = parsed.data;

    if (data.name && data.name !== existing.name) {
      const dup = await prisma.team.findUnique({ where: { name: data.name } });
      if (dup) return error(409, 'A team with this name already exists');
    }

    const updated = await prisma.team.update({
      where: { id: teamId },
      data: { name: data.name, color: data.color },
      include: {
        athletes: { select: { id: true, name: true, totalRaised: true } },
      },
    });

    return ok({ success: true, team: serializeTeam(updated) });
  } catch (e) {
    console.error('Error updating team:', e);
    return error(500, 'Failed to update team');
  }
}
