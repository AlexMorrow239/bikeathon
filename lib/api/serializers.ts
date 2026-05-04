import type { Athlete, Donation, Team } from '@prisma/client';
import type { Decimal } from '@prisma/client/runtime/library';

type TeamRef = Pick<Team, 'id' | 'name' | 'color'>;

type AthleteWithExtras = Athlete & {
  team?: TeamRef;
  _count?: { donations: number };
};

export function serializeAthlete(a: AthleteWithExtras) {
  return {
    id: a.id,
    slug: a.slug,
    name: a.name,
    bio: a.bio,
    photoUrl: a.photoUrl,
    totalRaised: a.totalRaised.toString(),
    goal: a.goal.toString(),
    milesGoal: a.milesGoal,
    teamId: a.teamId,
    team: a.team ? { id: a.team.id, name: a.team.name, color: a.team.color } : null,
    donationCount: a._count?.donations,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
  };
}

type TeamAthleteSubset = {
  id: number;
  name: string;
  slug?: string;
  totalRaised: Decimal;
  goal?: Decimal;
};

type TeamWithExtras = Team & {
  athletes?: TeamAthleteSubset[];
  _count?: { athletes: number };
};

export function serializeTeam(t: TeamWithExtras) {
  return {
    id: t.id,
    name: t.name,
    color: t.color,
    totalRaised: t.totalRaised.toString(),
    athleteCount: t._count?.athletes ?? t.athletes?.length ?? 0,
    athletes: t.athletes?.map((a) => ({
      id: a.id,
      name: a.name,
      slug: a.slug,
      totalRaised: a.totalRaised.toString(),
      goal: a.goal?.toString(),
    })),
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  };
}

export function serializeDonation(d: Donation) {
  return {
    id: d.id,
    amount: d.amount.toString(),
    donorName: d.donorName,
    stripePaymentIntentId: d.stripePaymentIntentId,
    athleteId: d.athleteId,
    createdAt: d.createdAt,
  };
}
