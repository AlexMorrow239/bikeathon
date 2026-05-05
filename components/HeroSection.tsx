import StatsSection from '@/components/StatsSection';
import { DONATIONS_ENABLED } from '@/lib/config';
import { Activity, Calendar, DollarSign, MapPin } from 'lucide-react';

interface HeroSectionProps {
  totalRaised: number;
  totalMiles: number;
  totalDonations: number;
  athleteCount: number;
}

export default function HeroSection({
  totalRaised,
  totalMiles,
  totalDonations,
  athleteCount,
}: HeroSectionProps) {
  return (
    <section className="bg-gradient-to-b from-primary-500 to-primary-600 text-white py-12 px-4">
      <div className="max-w-6xl mx-auto">
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

        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 md:p-6 mb-6">
          <div className="grid md:grid-cols-2 gap-4 items-center">
            <div className="text-center md:text-left">
              <p className="text-sm md:text-base text-white/90">
                Support the largest roster in program history as we ride to Nationals!
              </p>
            </div>
            <StatsSection
              totalRaised={totalRaised}
              totalMiles={totalMiles}
              totalDonations={totalDonations}
            />
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 mb-6 max-w-4xl mx-auto">
          <p className="text-sm md:text-base leading-relaxed text-white/90">
            This year, we have the <span className="text-orange-100 font-semibold">largest competitive roster in program history</span>! {athleteCount} athletes divided into four teams, all competing to see who can raise the most funds and cover the most distance!
            Your donations go directly toward <span className="text-orange-100">race registration fees, equipment costs, and bike maintenance</span>,
            helping us keep triathlon accessible to all UM students regardless of experience level. With Nationals being out-of-state this spring, every dollar truly makes a difference in getting our bikes and athletes to Mississippi. Our team goal is <span className="text-orange-100 font-semibold">$10,000</span>, and we&apos;re counting on your support to get there!
          </p>
        </div>

        <div className="text-center">
          <p className="text-base md:text-lg font-semibold text-orange-100 mb-2">
            GO TRI-CANES!
          </p>
          {DONATIONS_ENABLED && (
            <a
              href="#athletes-section"
              className="inline-flex items-center gap-2 bg-white text-primary-600 px-6 py-2.5 rounded-full font-semibold hover:bg-orange-50 transition-colors"
            >
              <DollarSign className="w-4 h-4" />
              Donate Now
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
