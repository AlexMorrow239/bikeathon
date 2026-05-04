import { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { verifyAdminPassword } from '@/app/api/utils/auth';
import { athleteUpdateSchema } from '@/lib/api/schemas';
import { serializeAthlete } from '@/lib/api/serializers';
import { ok, error, validationError } from '@/lib/api/responses';

const ATHLETE_INCLUDE = {
  team: true,
  _count: { select: { donations: true } },
} as const;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const athleteId = parseInt(id);
    if (isNaN(athleteId)) return error(400, 'Invalid athlete ID');

    const athlete = await prisma.athlete.findUnique({
      where: { id: athleteId },
      include: ATHLETE_INCLUDE,
    });
    if (!athlete) return error(404, 'Athlete not found');

    return ok(serializeAthlete(athlete));
  } catch (e) {
    console.error('Error fetching athlete:', e);
    return error(500, 'Failed to fetch athlete');
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
    const athleteId = parseInt(id);
    if (isNaN(athleteId)) return error(400, 'Invalid athlete ID');

    const existingAthlete = await prisma.athlete.findUnique({
      where: { id: athleteId },
    });
    if (!existingAthlete) return error(404, 'Athlete not found');

    const body = await request.json().catch(() => null);
    const parsed = athleteUpdateSchema.safeParse(body);
    if (!parsed.success) return validationError(parsed.error);
    const data = parsed.data;

    if (data.slug && data.slug !== existingAthlete.slug) {
      const dup = await prisma.athlete.findUnique({ where: { slug: data.slug } });
      if (dup) return error(409, 'An athlete with this slug already exists');
    }

    const updateData: Prisma.AthleteUpdateInput = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.bio !== undefined) updateData.bio = data.bio;
    if (data.photoUrl !== undefined) updateData.photoUrl = data.photoUrl;
    if (data.goal !== undefined) updateData.goal = data.goal;
    if (data.milesGoal !== undefined) updateData.milesGoal = data.milesGoal;
    if (data.teamId !== undefined) updateData.team = { connect: { id: data.teamId } };

    const teamChanged =
      data.teamId !== undefined && data.teamId !== existingAthlete.teamId;

    if (teamChanged) {
      const newTeamId = data.teamId!;
      const newTeam = await prisma.team.findUnique({ where: { id: newTeamId } });
      if (!newTeam) return error(404, 'Team not found');
      const result = await prisma.$transaction(async (tx) => {
        const updated = await tx.athlete.update({
          where: { id: athleteId },
          data: updateData,
          include: ATHLETE_INCLUDE,
        });

        const oldAgg = await tx.athlete.aggregate({
          where: { teamId: existingAthlete.teamId },
          _sum: { totalRaised: true },
        });
        await tx.team.update({
          where: { id: existingAthlete.teamId },
          data: { totalRaised: oldAgg._sum.totalRaised ?? 0 },
        });

        const newAgg = await tx.athlete.aggregate({
          where: { teamId: newTeamId },
          _sum: { totalRaised: true },
        });
        await tx.team.update({
          where: { id: newTeamId },
          data: { totalRaised: newAgg._sum.totalRaised ?? 0 },
        });

        return updated;
      });
      return ok({ success: true, athlete: serializeAthlete(result) });
    }

    const updated = await prisma.athlete.update({
      where: { id: athleteId },
      data: updateData,
      include: ATHLETE_INCLUDE,
    });
    return ok({ success: true, athlete: serializeAthlete(updated) });
  } catch (e) {
    console.error('Error updating athlete:', e);
    return error(500, 'Failed to update athlete');
  }
}
