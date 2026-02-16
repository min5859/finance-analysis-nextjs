export type TabKey = 'company' | 'bs' | 'is' | 'cf' | 'optimized' | 'audit';

export interface CorpSearchResult {
  corp_code: string;
  corp_name: string;
  stock_code: string;
}

export const KEY_ACCOUNTS: Record<string, string[]> = {
  BS: [
    '자산총계', '부채총계', '자본총계', '유동자산', '비유동자산',
    '유동부채', '비유동부채', '자본금', '이익잉여금', '현금및현금성자산',
    '매출채권', '재고자산', '매입채무',
  ],
  IS: [
    '매출액', '매출원가', '매출총이익', '판매비와관리비',
    '영업이익', '당기순이익', '법인세비용차감전순이익',
  ],
  CF: [
    '영업활동현금흐름', '투자활동현금흐름', '재무활동현금흐름',
    '기초현금및현금성자산', '기말현금및현금성자산',
  ],
};

export const TABS: { key: TabKey; label: string }[] = [
  { key: 'company', label: '기업정보' },
  { key: 'bs', label: '재무상태표' },
  { key: 'is', label: '손익계산서' },
  { key: 'cf', label: '현금흐름표' },
  { key: 'optimized', label: 'LLM 최적화 데이터' },
  { key: 'audit', label: '감사보고서' },
];

export const REPORT_TYPES = [
  { code: '11011', label: '사업보고서 (연간)' },
  { code: '11014', label: '1분기보고서' },
  { code: '11012', label: '반기보고서' },
  { code: '11013', label: '3분기보고서' },
];
