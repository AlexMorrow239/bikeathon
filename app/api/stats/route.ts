import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import Decimal from 'decimal.js';

export async function GET() {
  try {
    // Get overall totals using Prisma aggregation
    const [donationStats, athleteCount, teamCount, athleteMilesSum] = await Promise.all([
      // Total donations and amount
      prisma.donation.aggregate({
        _sum: {
          amount: true
        },
        _count: {
          id: true
        }
      }),
      // Total athletes
      prisma.athlete.count(),
      // Total teams
      prisma.team.count(),
      // Sum of all athlete mile goals
      prisma.athlete.aggregate({
        _sum: {
          milesGoal: true
        }
      })
    ]);

    // Calculate total raised (sum of all donations)
    const totalRaised = donationStats._sum.amount
      ? new Decimal(donationStats._sum.amount).toNumber()
      : 0;

    // Sum of all athlete mile goals
    const totalMiles = athleteMilesSum._sum.milesGoal || 0;

    return NextResponse.json({
      totalRaised,
      totalMiles,
      totalDonations: donationStats._count.id,
      athleteCount,
      teamCount,
      // Average donation (if there are any)
      averageDonation: donationStats._count.id > 0
        ? Math.round(totalRaised / donationStats._count.id)
        : 0
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}