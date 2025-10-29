import { NextResponse } from 'next/server'

/**
 * Verifies the admin password from the Authorization header
 * @param request - The incoming request
 * @returns true if authorized, NextResponse error if not
 */
export function verifyAdminPassword(request: Request): true | NextResponse {
  const adminPassword = process.env.ADMIN_PASSWORD

  if (!adminPassword) {
    console.error('ADMIN_PASSWORD environment variable is not set')
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    )
  }

  const authHeader = request.headers.get('authorization')

  if (!authHeader) {
    return NextResponse.json(
      { error: 'Authorization header required' },
      { status: 401 }
    )
  }

  // Support both "Bearer <password>" and just "<password>" formats
  const providedPassword = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : authHeader

  if (providedPassword !== adminPassword) {
    return NextResponse.json(
      { error: 'Invalid admin password' },
      { status: 401 }
    )
  }

  return true
}

/**
 * Validates that a string is a valid hex color
 * @param color - The color string to validate
 * @returns true if valid hex color, false otherwise
 */
export function isValidHexColor(color: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(color)
}

/**
 * Validates that a string is URL-friendly (slug)
 * @param slug - The slug to validate
 * @returns true if valid slug, false otherwise
 */
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9-]+$/.test(slug)
}

/**
 * Validates that a value is a positive number
 * @param value - The value to validate
 * @returns true if positive number, false otherwise
 */
export function isPositiveNumber(value: any): boolean {
  const num = Number(value)
  return !isNaN(num) && num > 0
}