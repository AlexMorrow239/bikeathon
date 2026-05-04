'use client';

import AthleteCard from '@/components/AthleteCard';
import AthleteSearch from '@/components/AthleteSearch';
import { Users } from 'lucide-react';
import { useMemo, useState } from 'react';

interface AthleteData {
  id: number;
  slug: string;
  name: string;
  bio: string | null;
  photoUrl: string | null;
  totalRaised: number;
  goal: number;
  milesGoal: number;
  team: {
    id: number;
    name: string;
    color: string;
  };
}

interface AthletesGridProps {
  athletes: AthleteData[];
}

export default function AthletesGrid({ athletes }: AthletesGridProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAthletes = useMemo(() => {
    if (!searchQuery.trim()) return athletes;
    const query = searchQuery.toLowerCase();
    return athletes.filter((athlete) => athlete.name.toLowerCase().includes(query));
  }, [athletes, searchQuery]);

  return (
    <section id="athletes-section" className="py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4">Support Our Athletes</h2>
          <p className="text-gray-600 mb-6">
            Find your athlete and make a donation to support their ride
          </p>
          <div className="flex justify-center">
            <AthleteSearch onSearch={setSearchQuery} />
          </div>
        </div>

        {filteredAthletes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAthletes.map((athlete) => (
              <AthleteCard key={athlete.id} athlete={athlete} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">
              {searchQuery
                ? `No athletes found matching "${searchQuery}"`
                : 'No athletes registered yet'}
            </p>
          </div>
        )}

        {searchQuery && filteredAthletes.length > 0 && (
          <p className="text-center mt-6 text-gray-600">
            Showing {filteredAthletes.length} of {athletes.length} athletes
          </p>
        )}
      </div>
    </section>
  );
}
