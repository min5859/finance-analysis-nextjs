export default function InfoBox({ children }: { children: React.ReactNode }) {
  return <div className="bg-gray-50 border-l-3 border-indigo-500 px-3 py-2 rounded text-sm my-2" style={{ borderLeftWidth: 3 }}>{children}</div>;
}
