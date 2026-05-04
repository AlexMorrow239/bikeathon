'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin/auth';
import {
  fieldErrorsFromZod,
  formDataToObject,
  isUniqueConstraintOn,
  redirectWithError,
} from '@/lib/admin/forms';
import { teamCreateSchema, teamUpdateSchema } from '@/lib/api/schemas';

export interface TeamFormState {
  error?: string;
  fieldErrors?: Record<string, string>;
}

function revalidateTeamPaths(teamId?: number) {
  revalidatePath('/admin/teams');
  revalidatePath('/');
  if (teamId !== undefined) revalidatePath(`/admin/teams/${teamId}`);
}

export async function createTeamAction(
  _prevState: TeamFormState | null,
  formData: FormData,
): Promise<TeamFormState> {
  await requireAdmin();

  const raw = formDataToObject(formData);
  const parsed = teamCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? 'Invalid input',
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  try {
    await prisma.team.create({ data: parsed.data });
  } catch (e) {
    if (isUniqueConstraintOn(e, 'name')) {
      return {
        error: 'A team with this name already exists',
        fieldErrors: { name: 'Name already in use' },
      };
    }
    throw e;
  }

  revalidateTeamPaths();
  redirect('/admin/teams');
}

export async function updateTeamAction(
  teamId: number,
  _prevState: TeamFormState | null,
  formData: FormData,
): Promise<TeamFormState> {
  await requireAdmin();

  const raw = formDataToObject(formData);
  const parsed = teamUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? 'Invalid input',
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }
  const data = parsed.data;

  const existing = await prisma.team.findUnique({ where: { id: teamId } });
  if (!existing) return { error: 'Team not found' };

  try {
    await prisma.team.update({
      where: { id: teamId },
      data: { name: data.name, color: data.color },
    });
  } catch (e) {
    if (isUniqueConstraintOn(e, 'name')) {
      return {
        error: 'A team with this name already exists',
        fieldErrors: { name: 'Name already in use' },
      };
    }
    throw e;
  }

  revalidateTeamPaths(teamId);
  redirect('/admin/teams');
}

export async function deleteTeamAction(teamId: number): Promise<void> {
  await requireAdmin();

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: { _count: { select: { athletes: true } } },
  });
  if (!team) redirectWithError('/admin/teams', 'Team not found');
  if (team._count.athletes > 0) {
    redirectWithError(
      '/admin/teams',
      `Cannot delete ${team.name}: ${team._count.athletes} athlete(s) still on this team`,
    );
  }

  await prisma.team.delete({ where: { id: teamId } });

  revalidateTeamPaths();
  redirect('/admin/teams');
}
