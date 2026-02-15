interface InsightCardProps {
  title?: string;
  content: string;
  variant?: 'default' | 'blue' | 'green' | 'red';
}

const variantStyles = {
  default: 'border-l-4 border-l-indigo-500 bg-gray-50',
  blue: 'border-l-4 border-l-blue-500 bg-blue-50',
  green: 'border-l-4 border-l-emerald-500 bg-emerald-50',
  red: 'border-l-4 border-l-red-500 bg-red-50',
};

export default function InsightCard({ title, content, variant = 'default' }: InsightCardProps) {
  if (!content) return null;

  return (
    <div className={`rounded-lg p-4 my-3 ${variantStyles[variant]}`}>
      {title && <h4 className="font-semibold text-gray-800 mb-2">{title}</h4>}
      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{content}</p>
    </div>
  );
}
