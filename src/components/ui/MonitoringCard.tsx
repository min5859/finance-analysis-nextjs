'use client';

const variantStyles = {
  default: 'bg-gray-50 border-gray-200 text-gray-700',
  info: 'bg-blue-50 border-blue-200 text-blue-700',
  success: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  warning: 'bg-amber-50 border-amber-200 text-amber-700',
  danger: 'bg-red-50 border-red-200 text-red-700',
};

interface MonitoringCardProps {
  message: string;
  variant?: keyof typeof variantStyles;
}

export default function MonitoringCard({ message, variant = 'default' }: MonitoringCardProps) {
  return (
    <div className={`rounded-lg border px-4 py-3 text-sm ${variantStyles[variant]}`}>
      {message}
    </div>
  );
}
