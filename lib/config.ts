/**
 * Global configuration for the Bikeathon application
 */

/**
 * Global fundraising goal for all athletes
 * This value is used for all athletes instead of individual goals
 * Default: $500
 */
export const GLOBAL_ATHLETE_GOAL = 500;

/**
 * Get the global athlete goal
 * @returns The global goal amount for all athletes
 */
export function getGlobalAthleteGoal(): number {
  return GLOBAL_ATHLETE_GOAL;
}