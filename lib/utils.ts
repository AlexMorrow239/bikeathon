import Decimal from 'decimal.js'

/**
 * Format a number as USD currency
 */
export function formatCurrency(amount: number | string | Decimal): string {
  const value = typeof amount === 'string' ? parseFloat(amount) :
                amount instanceof Decimal ? amount.toNumber() : amount

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

/**
 * Format a number as miles (same as dollars in our case)
 */
export function formatMiles(amount: number | string | Decimal): string {
  const value = typeof amount === 'string' ? parseFloat(amount) :
                amount instanceof Decimal ? amount.toNumber() : amount

  return `${Math.floor(value)} mile${value !== 1 ? 's' : ''}`
}

/**
 * Convert dollars to miles (1:1 ratio)
 */
export function dollarsToMiles(dollars: number | string | Decimal): number {
  const value = typeof dollars === 'string' ? parseFloat(dollars) :
                dollars instanceof Decimal ? dollars.toNumber() : dollars
  return Math.floor(value)
}

/**
 * Calculate percentage of goal
 */
export function calculateProgress(raised: number | string | Decimal, goal: number | string | Decimal): number {
  const raisedValue = typeof raised === 'string' ? parseFloat(raised) :
                      raised instanceof Decimal ? raised.toNumber() : raised
  const goalValue = typeof goal === 'string' ? parseFloat(goal) :
                    goal instanceof Decimal ? goal.toNumber() : goal

  if (goalValue === 0) return 0
  return Math.min(Math.round((raisedValue / goalValue) * 100), 100)
}

/**
 * Generate a URL-friendly slug from a name
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Format a date to a readable string
 */
export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(dateObj)
}

/**
 * Format a relative time string (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffInMs = now.getTime() - dateObj.getTime()
  const diffInSeconds = Math.floor(diffInMs / 1000)
  const diffInMinutes = Math.floor(diffInSeconds / 60)
  const diffInHours = Math.floor(diffInMinutes / 60)
  const diffInDays = Math.floor(diffInHours / 24)

  if (diffInSeconds < 60) {
    return 'just now'
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`
  } else if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`
  } else if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`
  } else {
    return formatDate(dateObj)
  }
}

/**
 * Get team position based on total raised (for race visualization)
 */
export function getTeamPosition(totalRaised: number, maxTotal: number): number {
  if (maxTotal === 0) return 0
  return (totalRaised / maxTotal) * 100
}

/**
 * Parse decimal string to number safely
 */
export function parseDecimal(value: string | number | Decimal | null | undefined): number {
  if (value === null || value === undefined) return 0
  if (typeof value === 'number') return value
  if (value instanceof Decimal) return value.toNumber()
  const parsed = parseFloat(value)
  return isNaN(parsed) ? 0 : parsed
}