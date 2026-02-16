import type { AuditData } from '@/hooks/useDartData';

interface AuditViewProps {
  auditData: AuditData | null;
}

export default function AuditView({ auditData }: AuditViewProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="font-semibold text-gray-800 mb-4">감사보고서</h3>
      {auditData?.list ? (
        <div className="space-y-3">
          {auditData.list.map((item, idx) => (
            <div key={idx} className="border border-gray-100 rounded p-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                {item.auditor && (
                  <div><span className="text-gray-500">감사인:</span> <span className="font-medium">{item.auditor}</span></div>
                )}
                {item.adt_reprt_opinion && (
                  <div><span className="text-gray-500">감사의견:</span> <span className="font-medium">{item.adt_reprt_opinion}</span></div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-400 text-center py-8">감사보고서 데이터가 없습니다.</p>
      )}
    </div>
  );
}
