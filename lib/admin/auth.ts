import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  SESSION_COOKIE_NAME,
  SESSION_TTL_SECONDS,
  signSession,
  timingSafeEqual,
  verifySession,
  type SessionPayload,
} from '@/lib/admin/session';

export async function getAdminSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE_NAME)?.value;
  return verifySession(token);
}

export async function requireAdmin(): Promise<SessionPayload> {
  const session = await getAdminSession();
  if (!session) redirect('/admin/login');
  return session;
}

export async function setAdminSessionCookie(): Promise<void> {
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const token = await signSession({ exp });
  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearAdminSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE_NAME);
}

export function safeAdminRedirect(next: string | null | undefined): string {
  if (!next) return '/admin';
  if (!next.startsWith('/')) return '/admin';
  if (next.startsWith('//')) return '/admin';
  if (next !== '/admin' && !next.startsWith('/admin/') && !next.startsWith('/admin?')) {
    return '/admin';
  }
  return next;
}

export function verifyAdminPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    throw new Error('ADMIN_PASSWORD environment variable is not set');
  }
  if (typeof password !== 'string') return false;
  const enc = new TextEncoder();
  return timingSafeEqual(enc.encode(password), enc.encode(expected));
}
