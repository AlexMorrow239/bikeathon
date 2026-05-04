'use server';

import { Prisma } from '@prisma/client';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin/auth';
import { fieldErrorsFromZod, formDataToObject } from '@/lib/admin/forms';
import { teamUpdateSchema } from '@/lib/api/schemas';

export interface TeamFormState {
  error?: string;
  fieldErrors?: Record<string, string>;
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
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === 'P2002' &&
      Array.isArray(e.meta?.target) &&
      (e.meta.target as string[]).includes('name')
    ) {
      return {
        error: 'A team with this name already exists',
        fieldErrors: { name: 'Name already in use' },
      };
    }
    throw e;
  }

  revalidatePath('/admin/teams');
  revalidatePath(`/admin/teams/${teamId}`);
  revalidatePath('/');
  redirect('/admin/teams');
}
