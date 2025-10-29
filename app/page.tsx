'use client';

import AthleteCard from '@/components/AthleteCard';
import AthleteSearch from '@/components/AthleteSearch';
import LoadingSpinner from '@/components/LoadingSpinner';
import TeamRaceTracker from '@/components/TeamRaceTracker';
import { formatCurrency, formatMiles } from '@/lib/utils';
import { Activity, AlertTriangle, Calendar, DollarSign, Heart, MapPin, RefreshCw, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

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
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);

  // Fetch all data
  const fetchData = async () => {
    try {
      setError(null);
      const [statsRes, teamsRes, athletesRes] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/teams'),
        fetch('/api/athletes')
      ]);

      // Check if any requests failed
      if (!statsRes.ok || !teamsRes.ok || !athletesRes.ok) {
        throw new Error('Failed to load data. Please try again.');
      }

      const [statsData, teamsData, athletesData] = await Promise.all([
        statsRes.json(),
        teamsRes.json(),
        athletesRes.json()
      ]);

      setStats(statsData);
      setTeams(teamsData);
      setAthletes(athletesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please refresh the page.');
    } finally {
      setLoading(false);
      setRetrying(false);
    }
  };

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, []);

  // Retry function
  const handleRetry = () => {
    setRetrying(true);
    setLoading(true);
    fetchData();
  };

  // Filter athletes based on search query
  const filteredAthletes = useMemo(() => {
    if (!searchQuery.trim()) return athletes;

    const query = searchQuery.toLowerCase();
    return athletes.filter(athlete =>
      athlete.name.toLowerCase().includes(query)
    );
  }, [athletes, searchQuery]);

  // Loading skeleton
  if (loading && !retrying) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Hero Section Skeleton */}
        <section className="bg-gradient-to-b from-primary-500 to-primary-600 text-white py-16 px-4">
          <div className="max-w-7xl mx-auto text-center">
            <div className="flex justify-center mb-4">
              <Activity className="w-16 h-16 animate-pulse" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Bikeathon Fundraiser
            </h1>
            <p className="text-2xl mb-8">
              $1 = 1 Mile • Every Dollar Counts!
            </p>
            {/* Stats skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white/10 backdrop-blur rounded-lg p-4">
                  <div className="h-9 bg-white/20 rounded animate-pulse mb-2"></div>
                  <div className="h-4 bg-white/20 rounded animate-pulse w-20 mx-auto"></div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Content area with spinner */}
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  // Error state
  if (error && !retrying) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <AlertTriangle className="w-16 h-16 text-warning-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Unable to Load Data</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={handleRetry}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Retrying indicator */}
      {retrying && (
        <div className="fixed top-4 right-4 bg-primary-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 z-50">
          <LoadingSpinner />
          <span>Refreshing data...</span>
        </div>
      )}

      {/* Hero Section - Condensed */}
      <section className="bg-gradient-to-b from-primary-500 to-primary-600 text-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="flex justify-center mb-3">
              <Activity className="w-12 h-12 md:w-14 md:h-14" />
            </div>
            <h1 className="text-3xl md:text-5xl font-bold mb-2">
              Tricanes Bikeathon 2025
            </h1>
            <p className="text-lg md:text-xl text-orange-100 font-medium">
              Fundraiser for Nationals • Gulfport, Mississippi
            </p>
          </div>

          {/* Event Details */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 mb-6 text-sm md:text-base">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>This Sunday</span>
            </div>
            <div className="hidden sm:block text-white/60">|</div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>Shark Valley Trail, Everglades</span>
            </div>
          </div>

          {/* Key Message & Stats in One Row */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 md:p-6 mb-6">
            <div className="grid md:grid-cols-2 gap-4 items-center">
              {/* Left: Key Concept */}
              <div className="text-center md:text-left">
                <h2 className="text-2xl md:text-3xl font-bold mb-2 flex items-center justify-center md:justify-start gap-2">
                  <span className="text-orange-100">$1 = 1 Mile</span>
                </h2>
                <p className="text-sm md:text-base text-white/90">
                  Support the largest roster in program history as we ride to Nationals!
                </p>
              </div>

              {/* Right: Live Stats */}
              {stats && (
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-xl md:text-2xl font-bold">{formatCurrency(stats.totalRaised)}</p>
                    <p className="text-xs opacity-80">Raised</p>
                  </div>
                  <div>
                    <p className="text-xl md:text-2xl font-bold">{formatMiles(stats.totalMiles)}</p>
                    <p className="text-xs opacity-80">Miles</p>
                  </div>
                  <div>
                    <p className="text-xl md:text-2xl font-bold">{stats.totalDonations}</p>
                    <p className="text-xs opacity-80">Donors</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Personal Mission Statement */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 mb-6 max-w-4xl mx-auto">
            <p className="text-sm md:text-base leading-relaxed text-white/90">
              This year, we have the <span className="text-orange-100 font-semibold">largest competitive roster in program history</span> —
              24 athletes divided into four teams of six, all competing to see who can raise the most funds and cover the most distance!
              Your donations go directly toward <span className="text-orange-100">race registration fees, equipment costs, and bike maintenance</span>,
              helping us keep triathlon accessible to all UM students regardless of experience level.
              With Nationals being out-of-state this spring, every dollar truly makes a difference in getting our bikes and athletes to Mississippi.
              Our team goal is <span className="text-orange-100 font-semibold">$10,000</span>, and we&apos;re counting on your support to get there!
            </p>
          </div>

          {/* Mobile-Friendly CTA */}
          <div className="text-center">
            <p className="text-base md:text-lg font-semibold text-orange-100 mb-2">
              GO TRI-CANES!
            </p>
            <button
              onClick={() => document.getElementById('athletes-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="inline-flex items-center gap-2 bg-white text-primary-600 px-6 py-2.5 rounded-full font-semibold hover:bg-orange-50 transition-colors"
            >
              <DollarSign className="w-4 h-4" />
              Donate Now
            </button>
          </div>

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
      <section id="athletes-section" className="py-12 px-4">
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
