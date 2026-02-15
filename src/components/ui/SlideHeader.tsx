interface SlideHeaderProps {
  title: string;
  subtitle?: string;
}

export default function SlideHeader({ title, subtitle }: SlideHeaderProps) {
  return (
    <div className="border-b-2 border-gray-200 pb-2 mb-6">
      <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
      {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );
}
