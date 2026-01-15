'use client';

interface HealthBarProps {
  value: number;
  max?: number;
  showValue?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function HealthBar({
  value,
  max = 100,
  showValue = true,
  size = 'md',
  className = '',
}: HealthBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const getColor = () => {
    if (percentage >= 70) return 'bg-green-500';
    if (percentage >= 50) return 'bg-yellow-500';
    if (percentage >= 30) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getHeight = () => {
    switch (size) {
      case 'sm':
        return 'h-2';
      case 'lg':
        return 'h-4';
      default:
        return 'h-3';
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`flex-1 bg-gray-200 rounded-full overflow-hidden ${getHeight()}`}>
        <div
          className={`${getHeight()} ${getColor()} transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showValue && (
        <span className="text-sm font-medium text-gray-700 w-12 text-right">
          {Math.round(value)}
        </span>
      )}
    </div>
  );
}

interface HealthIndicatorProps {
  value: number;
  label: string;
  description?: string;
}

export function HealthIndicator({ value, label, description }: HealthIndicatorProps) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-900">{label}</span>
        <span className="text-sm text-gray-500">{Math.round(value)}/100</span>
      </div>
      <HealthBar value={value} />
      {description && (
        <p className="text-xs text-gray-500">{description}</p>
      )}
    </div>
  );
}
