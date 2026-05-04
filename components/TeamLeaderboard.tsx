import TeamRaceTracker from '@/components/TeamRaceTracker';

interface TeamData {
  id: number;
  name: string;
  color: string;
  totalRaised: number;
  _count: { athletes: number };
}

interface TeamLeaderboardProps {
  teams: TeamData[];
}

export default function TeamLeaderboard({ teams }: TeamLeaderboardProps) {
  return (
    <section className="py-12 px-4 bg-white border-b">
      <div className="max-w-3xl mx-auto">
        <TeamRaceTracker teams={teams} />
      </div>
    </section>
  );
}
