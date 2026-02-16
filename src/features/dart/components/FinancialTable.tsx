'use client';

import { useState } from 'react';
import type { DartFinancialItem } from '@/types/dart';
import { formatBillion, convertToBillion } from '@/lib/format';

interface FinancialTableProps {
  items: DartFinancialItem[];
  keyItems: DartFinancialItem[];
  title: string;
}

export default function FinancialTable({ items, keyItems, title }: FinancialTableProps) {
  const [showAll, setShowAll] = useState(false);
  const displayItems = showAll ? items : keyItems;

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <h3 className="font-semibold text-gray-800">{title}</h3>
        <button
          onClick={() => setShowAll(!showAll)}
          className="text-xs text-indigo-600 hover:underline"
        >
          {showAll ? '주요항목만 보기' : `전체 항목 보기 (${items.length})`}
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-2 font-medium text-gray-600">계정명</th>
              <th className="text-right px-4 py-2 font-medium text-gray-600">당기 (억원)</th>
              <th className="text-right px-4 py-2 font-medium text-gray-600">전기 (억원)</th>
              <th className="text-right px-4 py-2 font-medium text-gray-600">전전기 (억원)</th>
            </tr>
          </thead>
          <tbody>
            {displayItems.map((item, idx) => (
              <tr key={`${item.account_nm}-${idx}`} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-2 text-gray-800">{item.account_nm}</td>
                <td className="px-4 py-2 text-right font-mono">{formatBillion(convertToBillion(item.thstrm_amount))}</td>
                <td className="px-4 py-2 text-right font-mono">{formatBillion(convertToBillion(item.frmtrm_amount))}</td>
                <td className="px-4 py-2 text-right font-mono">{formatBillion(convertToBillion(item.bfefrmtrm_amount))}</td>
              </tr>
            ))}
            {displayItems.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-400">데이터가 없습니다.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
