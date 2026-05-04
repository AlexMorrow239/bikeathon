import { NextResponse } from 'next/server';
import type { ZodError } from 'zod';

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function error(status: number, message: string, details?: unknown) {
  const body: { error: string; details?: unknown } = { error: message };
  if (details !== undefined) body.details = details;
  return NextResponse.json(body, { status });
}

export function validationError(zodError: ZodError) {
  const first = zodError.issues[0];
  return error(400, first?.message ?? 'Validation failed', {
    issues: zodError.issues.map((i) => ({
      path: i.path.join('.'),
      message: i.message,
    })),
  });
}
