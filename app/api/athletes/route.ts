import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAdminPassword } from '@/app/api/utils/auth';
import { athleteCreateSchema } from '@/lib/api/schemas';
import { serializeAthlete } from '@/lib/api/serializers';
import { ok, error, validationError } from '@/lib/api/responses';

export async function GET() {
  try {
    const athletes = await prisma.athlete.findMany({
      include: {
        team: true,
        _count: { select: { donations: true } },
      },
      orderBy: { totalRaised: 'desc' },
    });
    return ok(athletes.map(serializeAthlete));
  } catch (e) {
    console.error('Error fetching athletes:', e);
    return error(500, 'Failed to fetch athletes');
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = verifyAdminPassword(request);
    if (authResult !== true) return authResult;

    const body = await request.json().catch(() => null);
    const parsed = athleteCreateSchema.safeParse(body);
    if (!parsed.success) return validationError(parsed.error);
    const data = parsed.data;

    const team = await prisma.team.findUnique({ where: { id: data.teamId } });
    if (!team) return error(404, 'Team not found');

    const existing = await prisma.athlete.findUnique({ where: { slug: data.slug } });
    if (existing) return error(409, 'An athlete with this slug already exists');

    const newAthlete = await prisma.athlete.create({
      data: {
        name: data.name,
        slug: data.slug,
        bio: data.bio,
        photoUrl: data.photoUrl,
        ...(data.goal !== undefined ? { goal: data.goal } : {}),
        ...(data.milesGoal !== undefined ? { milesGoal: data.milesGoal } : {}),
        team: { connect: { id: data.teamId } },
      },
      include: {
        team: true,
        _count: { select: { donations: true } },
      },
    });

    return ok({ success: true, athlete: serializeAthlete(newAthlete) }, { status: 201 });
  } catch (e) {
    console.error('Error creating athlete:', e);
    return error(500, 'Failed to create athlete');
  }
}
