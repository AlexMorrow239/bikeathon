import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAdminPassword } from '@/app/api/utils/auth';
import { athleteUpdateSchema } from '@/lib/api/schemas';
import { serializeAthlete } from '@/lib/api/serializers';
import { ok, error, validationError } from '@/lib/api/responses';
import { updateAthleteWithRecalc } from '@/lib/services/athletes';

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

    const body = await request.json().catch(() => null);
    const parsed = athleteUpdateSchema.safeParse(body);
    if (!parsed.success) return validationError(parsed.error);

    const result = await updateAthleteWithRecalc(athleteId, parsed.data);
    if (!result.ok) {
      switch (result.reason) {
        case 'athlete_not_found':
          return error(404, 'Athlete not found');
        case 'team_not_found':
          return error(404, 'Team not found');
        case 'slug_conflict':
          return error(409, 'An athlete with this slug already exists');
      }
    }

    return ok({ success: true, athlete: serializeAthlete(result.athlete) });
  } catch (e) {
    console.error('Error updating athlete:', e);
    return error(500, 'Failed to update athlete');
  }
}
