import { z } from 'zod';
import { MAX_DONATION_AMOUNT, MIN_DONATION_AMOUNT } from '@/lib/config';

const slugRegex = /^[a-z0-9-]+$/;
const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;

const slugField = z
  .string()
  .trim()
  .min(1, 'Slug is required and must be a non-empty string')
  .transform((s) => s.toLowerCase())
  .refine((s) => slugRegex.test(s), {
    message: 'Slug must be URL-friendly (lowercase letters, numbers, and hyphens only)',
  });

const goalField = z.coerce
  .number({ message: 'Goal must be a positive number' })
  .positive('Goal must be a positive number')
  .max(1_000_000, 'Goal must be less than $1,000,000');

const milesGoalField = z.coerce
  .number({ message: 'Miles goal must be a positive integer' })
  .int('Miles goal must be a positive integer')
  .positive('Miles goal must be a positive integer')
  .max(10_000, 'Miles goal must be less than 10,000');

const teamIdField = z.coerce
  .number({ message: 'Team ID must be a valid number' })
  .int('Team ID must be a valid number')
  .positive('Team ID must be a valid number');

const colorField = z
  .string()
  .regex(hexColorRegex, 'Color must be a valid hex color (e.g., #f47321)');

export const athleteCreateSchema = z.object({
  name: z.string().trim().min(1, 'Athlete name is required and must be a non-empty string'),
  slug: slugField,
  bio: z.string().nullable().optional(),
  photoUrl: z.string().nullable().optional(),
  goal: goalField.optional(),
  milesGoal: milesGoalField.optional(),
  teamId: teamIdField,
});
export type AthleteCreateInput = z.infer<typeof athleteCreateSchema>;

export const athleteUpdateSchema = z
  .object({
    name: z.string().trim().min(1, 'Athlete name must be a non-empty string').optional(),
    slug: slugField.optional(),
    bio: z.string().nullable().optional(),
    photoUrl: z.string().nullable().optional(),
    goal: goalField.optional(),
    milesGoal: milesGoalField.optional(),
    teamId: teamIdField.optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: 'No valid fields to update' });
export type AthleteUpdateInput = z.infer<typeof athleteUpdateSchema>;

export const teamCreateSchema = z.object({
  name: z.string().trim().min(1, 'Team name is required and must be a non-empty string'),
  color: colorField,
});
export type TeamCreateInput = z.infer<typeof teamCreateSchema>;

export const teamUpdateSchema = z
  .object({
    name: z.string().trim().min(1, 'Team name must be a non-empty string').optional(),
    color: colorField.optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: 'No valid fields to update' });
export type TeamUpdateInput = z.infer<typeof teamUpdateSchema>;

export const paymentIntentSchema = z.object({
  amount: z.coerce
    .number({ message: 'Invalid donation amount. Please enter a valid number.' })
    .min(MIN_DONATION_AMOUNT, `Donation amount must be at least $${MIN_DONATION_AMOUNT}.`)
    .max(
      MAX_DONATION_AMOUNT,
      `Donation amount exceeds the maximum allowed ($${MAX_DONATION_AMOUNT.toLocaleString()}).`,
    ),
  athleteId: z.coerce
    .number({ message: 'Invalid athlete selection. Please refresh the page and try again.' })
    .int()
    .positive('Invalid athlete selection. Please refresh the page and try again.'),
  donorName: z.string().trim().min(1).max(100).optional(),
});
export type PaymentIntentInput = z.infer<typeof paymentIntentSchema>;
