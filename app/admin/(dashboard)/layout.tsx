import Link from 'next/link';
import { requireAdmin } from '@/lib/admin/auth';
import { logoutAction } from '@/app/admin/login/actions';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-secondary-500 text-white">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-6">
          <Link href="/admin" className="font-semibold">
            Bikeathon Admin
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/admin" className="hover:underline">
              Dashboard
            </Link>
            <Link href="/admin/athletes" className="hover:underline">
              Athletes
            </Link>
            <Link href="/admin/teams" className="hover:underline">
              Teams
            </Link>
          </nav>
          <form action={logoutAction} className="ml-auto">
            <button
              type="submit"
              className="text-sm hover:underline"
              aria-label="Log out"
            >
              Log out
            </button>
          </form>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
