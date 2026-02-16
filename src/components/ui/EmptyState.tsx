export default function EmptyState({ message }: { message?: string }) {
  return (
    <p className="text-gray-500 text-center py-12">
      {message || '기업 데이터를 먼저 로드해주세요.'}
    </p>
  );
}
