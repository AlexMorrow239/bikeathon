/**
 * Global configuration for the Bikeathon application
 */

/**
 * Global fundraising goal used for team race tracker calculations
 * Individual athletes have their own goals stored in the database
 * Default: $200
 */
export const GLOBAL_ATHLETE_GOAL = 200;

/**
 * Get the global athlete goal
 * @returns The global goal amount for all athletes
 */
export function getGlobalAthleteGoal(): number {
  return GLOBAL_ATHLETE_GOAL;
}