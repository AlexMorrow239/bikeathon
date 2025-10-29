import { formatCurrency, parseDecimal } from '@/lib/utils';
import { GLOBAL_ATHLETE_GOAL } from '@/lib/config';
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
  // Calculate team goals based on number of athletes
  const teamsWithGoals = teams.map(team => ({
    ...team,
    teamGoal: GLOBAL_ATHLETE_GOAL * (team._count?.athletes || 0)
  }));


  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-5 h-5" />
        <h2 className="text-xl font-bold">Team Competition</h2>
      </div>

      <div className="space-y-4">
        {teamsWithGoals.map((team, index) => {
          const raised = parseDecimal(team.totalRaised);
          const goalPercentage = team.teamGoal > 0 ? (raised / team.teamGoal) * 100 : 0;

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
                      <Trophy className="inline-block w-4 h-4 ml-1 text-primary-500" />
                    )}
                  </span>
                  {team._count && (
                    <span className="text-sm text-gray-500">
                      <Users className="inline w-3 h-3" /> {team._count.athletes}
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <span className="font-semibold block">
                    {formatCurrency(raised)}
                  </span>
                  {team.teamGoal > 0 && (
                    <span className="text-xs text-gray-500">
                      of {formatCurrency(team.teamGoal)} goal
                    </span>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              <div
                className="w-full bg-gray-200 rounded-full h-6 overflow-hidden"
                role="progressbar"
                aria-valuenow={Math.round(goalPercentage)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${team.name} fundraising progress`}
              >
                <div
                  className="h-full rounded-full flex items-center justify-end pr-2"
                  style={{
                    width: `${Math.min(Math.max(goalPercentage, 5), 100)}%`, // Minimum 5% for visibility, max 100%
                    backgroundColor: team.color,
                  }}
                >
                  {goalPercentage > 15 && (
                    <span className="text-white text-xs font-medium">
                      {Math.round(goalPercentage)}%
                    </span>
                  )}
                </div>
              </div>

              {/* Percentage outside if bar is too small */}
              {goalPercentage <= 15 && raised > 0 && (
                <span className="text-xs text-gray-500 mt-1 inline-block">
                  {Math.round(goalPercentage)}% of goal
                </span>
              )}
            </div>
          );
        })}

        {teamsWithGoals.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No teams yet</p>
          </div>
        )}
      </div>
    </div>
  );
}