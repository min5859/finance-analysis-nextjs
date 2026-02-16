export default function ParamGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h4 className="font-semibold text-indigo-600 text-sm mb-3">{title}</h4>
      {children}
    </div>
  );
}
