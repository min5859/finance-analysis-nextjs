/**
 * 재무제표 페이지 자동 탐지 (키워드 스코어링)
 * Streamlit pdf_extractor_app.py의 FinancialStatementDetector 로직을 TypeScript로 포팅
 * 테이블 구조 분석 제외, 텍스트 기반 스코어링만 사용
 */

export interface PageInfo {
  pageNumber: number;
  text: string;
}

export interface DetectedPage {
  pageNumber: number;
  statementType: string;
  score: number;
  matchedAccounts: number;
}

export interface DetectionResult {
  detectedPages: DetectedPage[];
  totalPages: number;
  /** 탐지된 페이지들의 텍스트만 합친 결과 (탐지 실패 시 전체 텍스트) */
  extractedText: string;
}

interface StatementIndicators {
  requiredKeywords: string[];
  accounts: string[];
  keywordWeight: number;
  accountWeight: number;
}

const STATEMENT_INDICATORS: Record<string, StatementIndicators> = {
  '재무상태표': {
    requiredKeywords: ['재무상태표', '대차대조표'],
    accounts: [
      '자산', '부채', '자본', '유동자산', '비유동자산', '유동부채', '비유동부채',
      '자본금', '자본잉여금', '이익잉여금', '현금및현금성자산', '매출채권', '재고자산',
      '유형자산', '무형자산', '투자자산', '매입채무', '차입금', '선수금',
    ],
    keywordWeight: 5,
    accountWeight: 1,
  },
  '손익계산서': {
    requiredKeywords: ['손익계산서', '포괄손익계산서'],
    accounts: [
      '매출액', '매출원가', '매출총이익', '영업이익', '영업비용', '당기순이익',
      '판매비와관리비', '영업외수익', '영업외비용', '법인세', '기타포괄손익',
      '주당이익', '세전이익', '판관비',
    ],
    keywordWeight: 5,
    accountWeight: 1,
  },
  '현금흐름표': {
    requiredKeywords: ['현금흐름표'],
    accounts: [
      '영업활동', '투자활동', '재무활동', '현금유입', '현금유출', '현금및현금성자산',
      '순증감', '기초현금', '기말현금', '이자수취', '이자지급', '배당금', '법인세납부',
    ],
    keywordWeight: 5,
    accountWeight: 1,
  },
  '자본변동표': {
    requiredKeywords: ['자본변동표'],
    accounts: [
      '자본금', '자본잉여금', '이익잉여금', '기타자본', '기타포괄손익누계액',
      '자기주식', '주식발행초과금', '전기이월', '배당금', '자본총계',
    ],
    keywordWeight: 5,
    accountWeight: 1,
  },
};

const CONTINUATION_KEYWORDS = ['(계속)', '계속', '이익잉여금처분계산서'];

// 테이블 분석 없이 텍스트만 사용하므로 Streamlit보다 낮은 임계값
const MIN_SCORE_THRESHOLD = 6;
const MIN_ACCOUNTS_REQUIRED = 2;

function normalizeText(text: string): string {
  return text.replace(/\s+/g, '').toLowerCase();
}

function calculateStatementScores(pageText: string) {
  const normalized = normalizeText(pageText);

  const scores: Record<string, number> = {};
  const matchedAccounts: Record<string, number> = {};

  for (const [type, indicators] of Object.entries(STATEMENT_INDICATORS)) {
    let score = 0;
    let accountsFound = 0;

    // 1. 필수키워드 점수
    for (const keyword of indicators.requiredKeywords) {
      if (normalized.includes(normalizeText(keyword))) {
        score += indicators.keywordWeight;
        break; // 하나만 카운트
      }
    }

    // 2. 계정과목 점수
    for (const account of indicators.accounts) {
      if (normalized.includes(normalizeText(account))) {
        accountsFound++;
      }
    }
    score += accountsFound * indicators.accountWeight;

    // 3. 계정과목 밀도 보너스 (최대 3점)
    if (normalized.length > 0) {
      const totalAccountChars = indicators.accounts
        .filter((acc) => normalized.includes(normalizeText(acc)))
        .reduce((sum, acc) => sum + normalizeText(acc).length, 0);
      const density = totalAccountChars / normalized.length;
      score += Math.min(3, Math.floor(density * 100));
    }

    scores[type] = score;
    matchedAccounts[type] = accountsFound;
  }

  return { scores, matchedAccounts };
}

export function detectFinancialPages(pages: PageInfo[]): DetectionResult {
  const detectedPages: DetectedPage[] = [];
  const statementTypes = new Map<number, string>();

  // 1단계: 키워드 스코어링으로 재무제표 페이지 식별
  for (const page of pages) {
    const { scores, matchedAccounts } = calculateStatementScores(page.text);

    // 가장 높은 점수의 유형 선택
    let maxType = '';
    let maxScore = 0;
    for (const [type, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score;
        maxType = type;
      }
    }

    if (
      maxScore >= MIN_SCORE_THRESHOLD &&
      matchedAccounts[maxType] >= MIN_ACCOUNTS_REQUIRED
    ) {
      detectedPages.push({
        pageNumber: page.pageNumber,
        statementType: maxType,
        score: maxScore,
        matchedAccounts: matchedAccounts[maxType],
      });
      statementTypes.set(page.pageNumber, maxType);
    }
  }

  // 2단계: 연속 페이지 탐지 (직전 페이지가 재무제표이고 계속 키워드 or 일정 점수 이상)
  const detectedSet = new Set(detectedPages.map((p) => p.pageNumber));

  for (const page of pages) {
    if (detectedSet.has(page.pageNumber)) continue;

    const prevPage = page.pageNumber - 1;
    if (!detectedSet.has(prevPage)) continue;

    const prevType = statementTypes.get(prevPage);
    if (!prevType) continue;

    // 계속 키워드 확인
    const hasContinuation = CONTINUATION_KEYWORDS.some((kw) =>
      page.text.includes(kw),
    );

    // 해당 유형에 대한 점수 확인
    const { scores, matchedAccounts } = calculateStatementScores(page.text);
    const typeScore = scores[prevType] || 0;

    if (hasContinuation || typeScore >= MIN_SCORE_THRESHOLD * 0.5) {
      detectedPages.push({
        pageNumber: page.pageNumber,
        statementType: prevType,
        score: typeScore,
        matchedAccounts: matchedAccounts[prevType],
      });
      statementTypes.set(page.pageNumber, prevType);
      detectedSet.add(page.pageNumber);
    }
  }

  // 정렬
  detectedPages.sort((a, b) => a.pageNumber - b.pageNumber);

  // 텍스트 추출: 탐지 성공 시 해당 페이지만, 실패 시 전체 페이지
  let extractedText: string;
  if (detectedPages.length > 0) {
    const detectedNums = new Set(detectedPages.map((p) => p.pageNumber));
    extractedText = pages
      .filter((p) => detectedNums.has(p.pageNumber))
      .map((p) => p.text)
      .join('\n\n');
  } else {
    extractedText = pages.map((p) => p.text).join('\n\n');
  }

  return {
    detectedPages,
    totalPages: pages.length,
    extractedText,
  };
}
