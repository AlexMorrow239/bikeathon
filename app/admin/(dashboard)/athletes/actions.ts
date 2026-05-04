'use server';

import { Prisma } from '@prisma/client';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin/auth';
import { fieldErrorsFromZod, formDataToObject } from '@/lib/admin/forms';
import {
  athleteCreateSchema,
  athleteUpdateSchema,
} from '@/lib/api/schemas';
import { updateAthleteWithRecalc } from '@/lib/services/athletes';

export interface AthleteFormState {
  error?: string;
  fieldErrors?: Record<string, string>;
}

function revalidateAthletePaths(slug?: string | null) {
  revalidatePath('/admin/athletes');
  revalidatePath('/');
  if (slug) revalidatePath(`/donate/${slug}`);
}

export async function createAthleteAction(
  _prevState: AthleteFormState | null,
  formData: FormData,
): Promise<AthleteFormState> {
  await requireAdmin();

  const raw = formDataToObject(formData);
  const parsed = athleteCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? 'Invalid input',
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }
  const data = parsed.data;

  const team = await prisma.team.findUnique({ where: { id: data.teamId } });
  if (!team) {
    return { error: 'Selected team does not exist', fieldErrors: { teamId: 'Team not found' } };
  }

  try {
    await prisma.athlete.create({
      data: {
        name: data.name,
        slug: data.slug,
        bio: data.bio,
        photoUrl: data.photoUrl,
        ...(data.goal !== undefined ? { goal: data.goal } : {}),
        ...(data.milesGoal !== undefined ? { milesGoal: data.milesGoal } : {}),
        team: { connect: { id: data.teamId } },
      },
    });
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === 'P2002' &&
      Array.isArray(e.meta?.target) &&
      (e.meta.target as string[]).includes('slug')
    ) {
      return {
        error: 'An athlete with this slug already exists',
        fieldErrors: { slug: 'Slug already in use' },
      };
    }
    throw e;
  }

  revalidateAthletePaths(data.slug);
  redirect('/admin/athletes');
}

export async function updateAthleteAction(
  athleteId: number,
  _prevState: AthleteFormState | null,
  formData: FormData,
): Promise<AthleteFormState> {
  await requireAdmin();

  const raw = formDataToObject(formData);
  const parsed = athleteUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? 'Invalid input',
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const result = await updateAthleteWithRecalc(athleteId, parsed.data);
  if (!result.ok) {
    switch (result.reason) {
      case 'athlete_not_found':
        return { error: 'Athlete not found' };
      case 'team_not_found':
        return {
          error: 'Selected team does not exist',
          fieldErrors: { teamId: 'Team not found' },
        };
      case 'slug_conflict':
        return {
          error: 'An athlete with this slug already exists',
          fieldErrors: { slug: 'Slug already in use' },
        };
    }
  }

  revalidateAthletePaths(result.athlete.slug);
  redirect('/admin/athletes');
}
