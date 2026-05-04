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
