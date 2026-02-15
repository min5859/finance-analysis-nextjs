'use client';
import { useCompanyStore } from '@/store/company-store';
import { DataLoader } from '@/lib/data-loader';
import SlideHeader from '@/components/ui/SlideHeader';

export default function ConclusionPage() {
  const companyData = useCompanyStore((s) => s.companyData);
  if (!companyData) return <p className="text-gray-500 text-center py-12">기업 데이터를 먼저 로드해주세요.</p>;

  const dl = new DataLoader(companyData);
  const conclusion = dl.getConclusion();

  return (
    <div>
      <SlideHeader title="종합 결론" />
      {/* 강점 */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-l-indigo-500 rounded-lg p-5 mb-6">
        <h3 className="text-lg font-bold text-indigo-800 mb-3">강점</h3>
        <div className="space-y-3">
          {conclusion.strengths?.filter(s => s.title).map((s, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-emerald-500 font-bold mt-0.5">✓</span>
              <div>
                <span className="font-semibold text-gray-800">{s.title}</span>
                {s.description && <span className="text-sm text-gray-600 ml-1">- {s.description}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* 약점 */}
      <div className="bg-gradient-to-r from-red-50 to-pink-50 border-l-4 border-l-red-500 rounded-lg p-5 mb-6">
        <h3 className="text-lg font-bold text-red-800 mb-3">개선 필요사항</h3>
        <div className="space-y-3">
          {conclusion.weaknesses?.filter(w => w.title).map((w, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-red-500 font-bold mt-0.5">!</span>
              <div>
                <span className="font-semibold text-gray-800">{w.title}</span>
                {w.description && <span className="text-sm text-gray-600 ml-1">- {w.description}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* 전략적 제안 */}
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-l-4 border-l-blue-500 rounded-lg p-5">
        <h3 className="text-lg font-bold text-blue-800 mb-3">전략적 제안</h3>
        <div className="space-y-4">
          {conclusion.strategic_recommendations?.filter(r => r.title).map((r, i) => (
            <div key={i}>
              <h4 className="font-semibold text-gray-800 mb-1">{i + 1}. {r.title}</h4>
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 ml-4">
                {r.items?.filter(Boolean).map((item, j) => (
                  <li key={j}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
