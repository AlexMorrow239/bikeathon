import { calculateProgress, formatCurrency, parseDecimal } from '@/lib/utils';
import { Bike, ChevronRight, Target } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import ProgressBar from './ProgressBar';

interface AthleteCardProps {
  athlete: {
    id: number;
    slug: string;
    name: string;
    bio?: string | null;
    photoUrl?: string | null;
    totalRaised: string | number;
    goal: string | number;
    milesGoal: number;
    team?: {
      id: number;
      name: string;
      color: string;
    };
  };
}

export default function AthleteCard({ athlete }: AthleteCardProps) {
  const raised = parseDecimal(athlete.totalRaised);
  const goal = athlete.goal ? parseDecimal(athlete.goal) : 200;
  const progress = calculateProgress(raised, goal);

  // Get initials for avatar placeholder
  const initials = athlete.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg hover:border-gray-300 transition-all">
      {/* Team affiliation bar */}
      {athlete.team && (
        <div
          className="h-1 -mx-6 -mt-6 mb-4 rounded-t-lg"
          style={{ backgroundColor: athlete.team.color }}
        />
      )}

      {/* Athlete info */}
      <div className="flex items-start gap-4 mb-4">
        {/* Avatar */}
        <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
          {athlete.photoUrl ? (
            <Image
              src={athlete.photoUrl}
              alt={athlete.name}
              width={64}
              height={64}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <div className="text-gray-600 font-semibold text-lg">
              {initials}
            </div>
          )}
        </div>

        {/* Name and team */}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-lg truncate">{athlete.name}</h3>
          {athlete.team && (
            <p className="text-sm text-gray-600 flex items-center gap-1">
              <span
                className="w-2 h-2 rounded-full inline-block"
                style={{ backgroundColor: athlete.team.color }}
              />
              {athlete.team.name}
            </p>
          )}
        </div>
      </div>

      {/* Bio snippet */}
      {athlete.bio && (
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {athlete.bio}
        </p>
      )}

      {/* Miles Goal Badge */}
      {athlete.milesGoal && (
        <div className="mb-3 bg-primary-50 border border-primary-200 rounded-lg px-3 py-2 flex items-center gap-2">
          <Bike className="w-4 h-4 text-primary-600" />
          <span className="text-sm font-medium text-primary-700">
            Riding {athlete.milesGoal} miles
          </span>
        </div>
      )}

      {/* Progress section */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600">
            <Target className="inline w-4 h-4 mr-1" />
            Goal: {formatCurrency(goal)}
          </span>
          <span className="font-semibold">
            {formatCurrency(raised)}
          </span>
        </div>
        <ProgressBar percentage={progress} label={`${athlete.name}'s fundraising progress`} />
        <p className="text-xs text-gray-500 mt-1">
          {progress}% of fundraising goal
        </p>
      </div>

      {/* Donate button */}
      <Link
        href={`/donate/${athlete.slug}`}
        className="w-full bg-primary-500 text-white py-2 px-4 rounded-lg hover:bg-primary-600 active:bg-primary-700 transition-colors flex items-center justify-center gap-2 font-medium"
      >
        Donate
        <ChevronRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
