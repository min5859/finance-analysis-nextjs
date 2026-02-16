import type { DartFinancialItem } from '@/types/dart';
import { convertToBillion } from '@/lib/format';
import { KEY_ACCOUNTS } from '@/features/dart/constants';

interface OptimizedAccount {
  account_nm: string;
  thstrm: number;
  frmtrm: number;
  bfefrmtrm: number;
}

interface OptimizedDartJson {
  company: string;
  year: string;
  sector?: string;
  unit: string;
  balance_sheet: OptimizedAccount[];
  income_statement: OptimizedAccount[];
  cash_flow: OptimizedAccount[];
}

function getKeyItems(items: DartFinancialItem[], sjDiv: string): OptimizedAccount[] {
  const keys = KEY_ACCOUNTS[sjDiv] || [];
  return items
    .filter((i) => i.sj_div === sjDiv)
    .filter((i) => keys.some((k) => i.account_nm.includes(k)))
    .map((i) => ({
      account_nm: i.account_nm,
      thstrm: convertToBillion(i.thstrm_amount),
      frmtrm: convertToBillion(i.frmtrm_amount),
      bfefrmtrm: convertToBillion(i.bfefrmtrm_amount),
    }));
}

export function buildOptimizedDartJson(
  items: DartFinancialItem[],
  corpName: string,
  year: string,
  sector?: string,
): { json: OptimizedDartJson; text: string } {
  const json: OptimizedDartJson = {
    company: corpName,
    year,
    ...(sector && { sector }),
    unit: '억원',
    balance_sheet: getKeyItems(items, 'BS'),
    income_statement: getKeyItems(items, 'IS'),
    cash_flow: getKeyItems(items, 'CF'),
  };

  const text = JSON.stringify(json, null, 2);
  return { json, text };
}
