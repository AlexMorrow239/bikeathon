'use server';

import { redirect } from 'next/navigation';
import {
  clearAdminSessionCookie,
  safeAdminRedirect,
  setAdminSessionCookie,
  verifyAdminPassword,
} from '@/lib/admin/auth';

export interface LoginActionState {
  error?: string;
}

export async function loginAction(
  _prevState: LoginActionState | null,
  formData: FormData,
): Promise<LoginActionState> {
  const password = formData.get('password');
  const nextRaw = formData.get('next');

  if (typeof password !== 'string' || password.length === 0) {
    return { error: 'Password is required' };
  }

  if (!verifyAdminPassword(password)) {
    return { error: 'Invalid password' };
  }

  await setAdminSessionCookie();
  redirect(safeAdminRedirect(typeof nextRaw === 'string' ? nextRaw : null));
}

export async function logoutAction(): Promise<void> {
  await clearAdminSessionCookie();
  redirect('/admin/login');
}
