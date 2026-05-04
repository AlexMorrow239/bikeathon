import AthletesGrid from '@/components/AthletesGrid';
import HeroSection from '@/components/HeroSection';
import TeamLeaderboard from '@/components/TeamLeaderboard';
import prisma from '@/lib/prisma';
import { Heart } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const [athletes, teams, donationStats] = await Promise.all([
    prisma.athlete.findMany({
      include: { team: true },
      orderBy: { totalRaised: 'desc' },
    }),
    prisma.team.findMany({
      include: { _count: { select: { athletes: true } } },
      orderBy: { totalRaised: 'desc' },
    }),
    prisma.donation.aggregate({
      _sum: { amount: true },
      _count: { id: true },
    }),
  ]);

  const totalRaised = donationStats._sum.amount?.toNumber() ?? 0;
  const totalMiles = athletes.reduce((sum, a) => sum + a.milesGoal, 0);
  const totalDonations = donationStats._count.id;

  const athletesData = athletes.map((a) => ({
    id: a.id,
    slug: a.slug,
    name: a.name,
    bio: a.bio,
    photoUrl: a.photoUrl,
    totalRaised: a.totalRaised.toNumber(),
    goal: a.goal.toNumber(),
    milesGoal: a.milesGoal,
    team: { id: a.team.id, name: a.team.name, color: a.team.color },
  }));

  const teamsData = teams.map((t) => ({
    id: t.id,
    name: t.name,
    color: t.color,
    totalRaised: t.totalRaised.toNumber(),
    _count: { athletes: t._count.athletes },
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <HeroSection
        totalRaised={totalRaised}
        totalMiles={totalMiles}
        totalDonations={totalDonations}
        athleteCount={athletes.length}
      />
      <TeamLeaderboard teams={teamsData} />
      <AthletesGrid athletes={athletesData} />
      <footer className="bg-secondary-700 text-white py-8 px-4 mt-12">
        <div className="max-w-7xl mx-auto text-center">
          <p className="flex items-center justify-center gap-2 mb-2">
            <Heart className="w-4 h-4 text-primary-400" />
            Thank you for supporting our bikeathon!
          </p>
          <p className="text-sm text-secondary-200">
            Every donation helps our athletes reach their goals and supports a great cause.
          </p>
        </div>
      </footer>
    </div>
  );
}
