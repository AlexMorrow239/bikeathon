interface ProgressBarProps {
  percentage: number;
  label?: string;
}

export default function ProgressBar({ percentage, label }: ProgressBarProps) {
  // Ensure percentage is within bounds
  const clampedPercentage = Math.min(100, Math.max(0, percentage));

  return (
    <div
      className="w-full bg-gray-200 rounded-full h-2 overflow-hidden"
      role="progressbar"
      aria-valuenow={clampedPercentage}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label || `Progress: ${clampedPercentage}%`}
    >
      <div
        className={`h-2 rounded-full transition-all duration-500 ${
          clampedPercentage >= 100
            ? 'bg-success-500'
            : clampedPercentage >= 75
            ? 'bg-primary-400'
            : clampedPercentage >= 50
            ? 'bg-primary-500'
            : 'bg-primary-600'
        }`}
        style={{
          width: `${clampedPercentage}%`,
          minWidth: clampedPercentage > 0 ? '2px' : '0'
        }}
      />
    </div>
  );
}
