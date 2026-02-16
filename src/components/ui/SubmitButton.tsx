export default function SubmitButton({ onClick }: { onClick: () => void }) {
  return (
    <div className="text-center">
      <button
        onClick={onClick}
        className="px-8 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
      >
        가치평가 계산 시작
      </button>
    </div>
  );
}
