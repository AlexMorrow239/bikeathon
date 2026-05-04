import { redirect } from 'next/navigation';
import { getAdminSession, safeAdminRedirect } from '@/lib/admin/auth';
import LoginForm from './LoginForm';

export const metadata = {
  title: 'Admin login',
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const session = await getAdminSession();
  if (session) redirect(safeAdminRedirect(next));

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-lg shadow p-6">
        <h1 className="text-xl font-semibold text-gray-900 mb-1">
          Bikeathon Admin
        </h1>
        <p className="text-sm text-gray-600 mb-6">
          Sign in to manage athletes and teams.
        </p>
        <LoginForm next={next ?? ''} />
      </div>
    </div>
  );
}
