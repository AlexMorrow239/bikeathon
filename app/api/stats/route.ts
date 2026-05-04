import prisma from '@/lib/prisma';
import { ok, error } from '@/lib/api/responses';

export async function GET() {
  try {
    const [donationStats, athleteCount, teamCount, athleteMilesSum] = await Promise.all([
      prisma.donation.aggregate({ _sum: { amount: true }, _count: { id: true } }),
      prisma.athlete.count(),
      prisma.team.count(),
      prisma.athlete.aggregate({ _sum: { milesGoal: true } }),
    ]);

    const totalRaised = donationStats._sum.amount?.toNumber() ?? 0;
    const totalMiles = athleteMilesSum._sum.milesGoal ?? 0;
    const totalDonations = donationStats._count.id;

    return ok({
      totalRaised,
      totalMiles,
      totalDonations,
      athleteCount,
      teamCount,
      averageDonation: totalDonations > 0 ? Math.round(totalRaised / totalDonations) : 0,
    });
  } catch (e) {
    console.error('Error fetching stats:', e);
    return error(500, 'Failed to fetch statistics');
  }
}
