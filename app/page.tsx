'use client';

import { useState, useEffect, useMemo } from 'react';
import { Activity, Heart, Users } from 'lucide-react';
import AthleteCard from '@/components/AthleteCard';
import AthleteSearch from '@/components/AthleteSearch';
import TeamRaceTracker from '@/components/TeamRaceTracker';
import LoadingSpinner from '@/components/LoadingSpinner';
import { formatCurrency, formatMiles } from '@/lib/utils';

interface Stats {
  totalRaised: number;
  totalMiles: number;
  totalDonations: number;
  athleteCount: number;
  teamCount: number;
}

interface Team {
  id: number;
  name: string;
  color: string;
  totalRaised: string;
  _count?: {
    athletes: number;
  };
}

interface Athlete {
  id: number;
  slug: string;
  name: string;
  bio?: string | null;
  photoUrl?: string | null;
  totalRaised: string;
  goal: string;
  team: {
    id: number;
    name: string;
    color: string;
  };
}

export default function Home() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch all data on mount
  useEffect(() => {
    Promise.all([
      fetch('/api/stats').then(r => r.json()),
      fetch('/api/teams').then(r => r.json()),
      fetch('/api/athletes').then(r => r.json())
    ])
      .then(([statsData, teamsData, athletesData]) => {
        setStats(statsData);
        setTeams(teamsData);
        setAthletes(athletesData);
      })
      .catch(error => {
        console.error('Error fetching data:', error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Filter athletes based on search query
  const filteredAthletes = useMemo(() => {
    if (!searchQuery.trim()) return athletes;

    const query = searchQuery.toLowerCase();
    return athletes.filter(athlete =>
      athlete.name.toLowerCase().includes(query)
    );
  }, [athletes, searchQuery]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-600 to-blue-700 text-white py-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex justify-center mb-4">
            <Activity className="w-16 h-16" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Bikeathon Fundraiser
          </h1>
          <p className="text-2xl mb-8">
            $1 = 1 Mile • Every Dollar Counts!
          </p>

          {/* Overall stats */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
              <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                <p className="text-3xl font-bold">{formatCurrency(stats.totalRaised)}</p>
                <p className="text-sm opacity-90">Total Raised</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                <p className="text-3xl font-bold">{formatMiles(stats.totalMiles)}</p>
                <p className="text-sm opacity-90">Miles Committed</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                <p className="text-3xl font-bold">{stats.totalDonations}</p>
                <p className="text-sm opacity-90">Donations</p>
              </div>
            </div>
          )}

          <p className="mt-8 text-lg">
            Support your favorite athlete and help them reach their fundraising goal!
          </p>
        </div>
      </section>

      {/* Team Competition Section */}
      <section className="py-12 px-4 bg-white border-b">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl mx-auto">
            <TeamRaceTracker teams={teams} />
          </div>
        </div>
      </section>

      {/* Athletes Section */}
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">Support Our Athletes</h2>
            <p className="text-gray-600 mb-6">
              Find your athlete and make a donation to support their ride
            </p>

            {/* Search Bar */}
            <div className="flex justify-center">
              <AthleteSearch onSearch={setSearchQuery} />
            </div>
          </div>

          {/* Athletes Grid */}
          {filteredAthletes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredAthletes.map(athlete => (
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

          {/* Results count */}
          {searchQuery && filteredAthletes.length > 0 && (
            <p className="text-center mt-6 text-gray-600">
              Showing {filteredAthletes.length} of {athletes.length} athletes
            </p>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8 px-4 mt-12">
        <div className="max-w-7xl mx-auto text-center">
          <p className="flex items-center justify-center gap-2 mb-2">
            <Heart className="w-4 h-4 text-red-500" />
            Thank you for supporting our bikeathon!
          </p>
          <p className="text-sm text-gray-400">
            Every donation helps our athletes reach their goals and supports a great cause.
          </p>
        </div>
      </footer>
    </div>
  );
}