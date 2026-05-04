import { Prisma } from '@prisma/client';
import { redirect } from 'next/navigation';
import type { ZodError } from 'zod';

export function formDataToObject(formData: FormData): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      out[key] = trimmed === '' ? undefined : trimmed;
    }
  }
  return out;
}

export function fieldErrorsFromZod(
  zodError: ZodError,
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of zodError.issues) {
    const path = issue.path.join('.');
    if (path && !result[path]) result[path] = issue.message;
  }
  return result;
}

export function isUniqueConstraintOn(e: unknown, field: string): boolean {
  if (
    !(e instanceof Prisma.PrismaClientKnownRequestError) ||
    e.code !== 'P2002'
  ) {
    return false;
  }
  const target = e.meta?.target;
  return Array.isArray(target) && target.some((t) => t === field);
}

export function redirectWithError(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}
