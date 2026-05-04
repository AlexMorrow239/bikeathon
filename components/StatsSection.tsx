import { formatCurrency, formatMiles } from '@/lib/utils';

interface StatsSectionProps {
  totalRaised: number;
  totalMiles: number;
  totalDonations: number;
}

export default function StatsSection({
  totalRaised,
  totalMiles,
  totalDonations,
}: StatsSectionProps) {
  return (
    <div className="grid grid-cols-3 gap-2 text-center">
      <div>
        <p className="text-xl md:text-2xl font-bold">{formatCurrency(totalRaised)}</p>
        <p className="text-xs opacity-80">Raised</p>
      </div>
      <div>
        <p className="text-xl md:text-2xl font-bold">{formatMiles(totalMiles)}</p>
        <p className="text-xs opacity-80">Miles</p>
      </div>
      <div>
        <p className="text-xl md:text-2xl font-bold">{totalDonations}</p>
        <p className="text-xs opacity-80">Donors</p>
      </div>
    </div>
  );
}
