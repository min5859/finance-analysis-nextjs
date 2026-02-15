/** 숫자를 억원 단위 포맷 (예: 1234 → "1,234") */
export function formatBillion(value: number): string {
  return value.toLocaleString('ko-KR');
}

/** 퍼센트 포맷 (예: 4.5 → "4.5%") */
export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

/** 배수 포맷 (예: 1.72 → "1.72배") */
export function formatMultiple(value: number): string {
  return `${value.toFixed(2)}배`;
}

/** 일수 포맷 (예: 36.7 → "36.7일") */
export function formatDays(value: number): string {
  return `${value.toFixed(1)}일`;
}

/** delta 값 계산 (최신 - 이전) */
export function calcDelta(arr: number[]): number | null {
  if (arr.length < 2) return null;
  return arr[arr.length - 1] - arr[arr.length - 2];
}

/** 최신값 가져오기 */
export function latest(arr: number[]): number {
  return arr[arr.length - 1] ?? 0;
}

/** 이전값 가져오기 */
export function previous(arr: number[]): number {
  return arr.length >= 2 ? arr[arr.length - 2] : 0;
}
