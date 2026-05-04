import { NextResponse } from 'next/server';

/**
 * Verifies the admin password from the Authorization header.
 * Returns true if authorized, or a NextResponse with the appropriate error status.
 */
export function verifyAdminPassword(request: Request): true | NextResponse {
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    console.error('ADMIN_PASSWORD environment variable is not set');
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'Authorization header required' }, { status: 401 });
  }

  const providedPassword = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : authHeader;

  if (providedPassword !== adminPassword) {
    return NextResponse.json({ error: 'Invalid admin password' }, { status: 401 });
  }

  return true;
}
