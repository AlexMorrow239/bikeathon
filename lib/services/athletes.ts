import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import type { AthleteUpdateInput } from '@/lib/api/schemas';

const ATHLETE_INCLUDE = {
  team: true,
  _count: { select: { donations: true } },
} as const;

export type AthleteWithIncludes = Prisma.AthleteGetPayload<{
  include: typeof ATHLETE_INCLUDE;
}>;

export type UpdateAthleteResult =
  | { ok: true; athlete: AthleteWithIncludes }
  | {
      ok: false;
      reason: 'athlete_not_found' | 'team_not_found' | 'slug_conflict';
    };

export async function updateAthleteWithRecalc(
  athleteId: number,
  data: AthleteUpdateInput,
): Promise<UpdateAthleteResult> {
  const existing = await prisma.athlete.findUnique({ where: { id: athleteId } });
  if (!existing) return { ok: false, reason: 'athlete_not_found' };

  if (data.slug && data.slug !== existing.slug) {
    const dup = await prisma.athlete.findUnique({ where: { slug: data.slug } });
    if (dup) return { ok: false, reason: 'slug_conflict' };
  }

  const updateData: Prisma.AthleteUpdateInput = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.slug !== undefined) updateData.slug = data.slug;
  if (data.bio !== undefined) updateData.bio = data.bio;
  if (data.photoUrl !== undefined) updateData.photoUrl = data.photoUrl;
  if (data.goal !== undefined) updateData.goal = data.goal;
  if (data.milesGoal !== undefined) updateData.milesGoal = data.milesGoal;
  if (data.teamId !== undefined) {
    updateData.team = { connect: { id: data.teamId } };
  }

  const newTeamId = data.teamId;
  const teamChanged =
    newTeamId !== undefined && newTeamId !== existing.teamId;

  if (teamChanged) {
    const newTeam = await prisma.team.findUnique({ where: { id: newTeamId } });
    if (!newTeam) return { ok: false, reason: 'team_not_found' };

    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.athlete.update({
        where: { id: athleteId },
        data: updateData,
        include: ATHLETE_INCLUDE,
      });
      const oldAgg = await tx.athlete.aggregate({
        where: { teamId: existing.teamId },
        _sum: { totalRaised: true },
      });
      await tx.team.update({
        where: { id: existing.teamId },
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
      return u;
    });
    return { ok: true, athlete: updated };
  }

  const updated = await prisma.athlete.update({
    where: { id: athleteId },
    data: updateData,
    include: ATHLETE_INCLUDE,
  });
  return { ok: true, athlete: updated };
}
