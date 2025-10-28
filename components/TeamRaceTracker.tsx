import { formatCurrency, parseDecimal } from '@/lib/utils';
import { Trophy, Users } from 'lucide-react';

interface Team {
  id: number;
  name: string;
  color: string;
  totalRaised: string | number;
  _count?: {
    athletes: number;
  };
}

interface TeamRaceTrackerProps {
  teams: Team[];
}

export default function TeamRaceTracker({ teams }: TeamRaceTrackerProps) {
  // Find the maximum total for calculating percentages
  const maxTotal = Math.max(
    ...teams.map(team => parseDecimal(team.totalRaised)),
    1 // Avoid division by zero
  );

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-5 h-5" />
        <h2 className="text-xl font-bold">Team Competition</h2>
      </div>

      <div className="space-y-4">
        {teams.map((team, index) => {
          const raised = parseDecimal(team.totalRaised);
          const percentage = (raised / maxTotal) * 100;

          return (
            <div key={team.id} className="relative">
              {/* Team name and amount */}
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: team.color }}
                  />
                  <span className="font-medium">
                    {team.name}
                    {index === 0 && raised > 0 && (
                      <Trophy className="inline-block w-4 h-4 ml-1 text-yellow-500" />
                    )}
                  </span>
                  {team._count && (
                    <span className="text-sm text-gray-500">
                      <Users className="inline w-3 h-3" /> {team._count.athletes}
                    </span>
                  )}
                </div>
                <span className="font-semibold">
                  {formatCurrency(raised)}
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300 flex items-center justify-end pr-2"
                  style={{
                    width: `${Math.max(percentage, 5)}%`, // Minimum 5% for visibility
                    backgroundColor: team.color,
                  }}
                >
                  {percentage > 15 && (
                    <span className="text-white text-xs font-medium">
                      {Math.round(percentage)}%
                    </span>
                  )}
                </div>
              </div>

              {/* Percentage outside if bar is too small */}
              {percentage <= 15 && raised > 0 && (
                <span className="text-xs text-gray-500 mt-1 inline-block">
                  {Math.round(percentage)}%
                </span>
              )}
            </div>
          );
        })}

        {teams.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No teams yet</p>
          </div>
        )}
      </div>
    </div>
  );
}