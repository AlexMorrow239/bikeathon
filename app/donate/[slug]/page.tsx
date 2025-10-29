import { DonationForm } from '@/components/DonationForm';
import ProgressBar from '@/components/ProgressBar';
import prisma from '@/lib/prisma';
import { dollarsToMiles, formatCurrency } from '@/lib/utils';
import { GLOBAL_ATHLETE_GOAL } from '@/lib/config';
import Decimal from 'decimal.js';
import { notFound } from 'next/navigation';

interface DonationPageProps {
  params: Promise<{
    slug: string;
  }>;
}

async function getAthlete(slug: string) {
  const athlete = await prisma.athlete.findUnique({
    where: { slug },
    include: { team: true },
  });

  if (!athlete) {
    notFound();
  }

  return athlete;
}

export default async function DonatePage({ params }: DonationPageProps) {
  const { slug } = await params;
  const athlete = await getAthlete(slug);

  // Convert Decimal to number for display
  const totalRaised = new Decimal(athlete.totalRaised).toNumber();
  const goal = GLOBAL_ATHLETE_GOAL;
  const progressPercentage = Math.min((totalRaised / goal) * 100, 100);

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-2xl mx-auto">
        {/* Athlete Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-gray-900">{athlete.name}</h1>
          <p className="text-lg text-gray-600 flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full inline-block"
              style={{ backgroundColor: athlete.team.color }}
            />
            Team {athlete.team.name}
          </p>

          {/* Bio */}
          {athlete.bio && (
            <p className="mt-4 text-gray-700">{athlete.bio}</p>
          )}
        </div>

        {/* Progress Section */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            <span>{formatCurrency(totalRaised)} raised</span>
            <span>Goal: {formatCurrency(goal)}</span>
          </div>
          <ProgressBar percentage={progressPercentage} />
          <p className="text-sm text-gray-600 mt-2">
            {dollarsToMiles(totalRaised)} miles committed so far!
          </p>
        </div>

        {/* Donation Form */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h2 className="text-2xl font-semibold mb-4 text-gray-900">Make a Donation</h2>
          <p className="text-gray-600 mb-4">
            Every dollar you donate = 1 mile {athlete.name} will ride!
          </p>
          <DonationForm
            athleteId={athlete.id}
            athleteName={athlete.name}
          />
        </div>
      </div>
    </div>
  );
}
