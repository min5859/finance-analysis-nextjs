import type { AssetParams, ValuationResult } from '../types';

export function calculateAsset(
  p: AssetParams,
  totalAssets: number,
  totalLiabilities: number,
): ValuationResult {
  const otherPercent = 100 - p.realEstatePercent - p.equipmentPercent - p.inventoryPercent - p.intangiblePercent;

  const adjustedAssets =
    totalAssets * (p.realEstatePercent / 100) * (1 + p.realEstateAdj / 100) +
    totalAssets * (p.equipmentPercent / 100) * (1 + p.equipmentAdj / 100) +
    totalAssets * (p.inventoryPercent / 100) * (1 + p.inventoryAdj / 100) +
    totalAssets * (p.intangiblePercent / 100) * (1 + p.intangibleAdj / 100) +
    totalAssets * (otherPercent / 100) * (1 + p.otherAdj / 100);

  const adjustedLiabilities = totalLiabilities * (1 + p.liabilityAdj / 100) + p.contingentLiability;
  const liquidationCost = adjustedAssets * (p.liquidationCostPercent / 100);
  const nav = adjustedAssets - adjustedLiabilities - liquidationCost;

  return {
    method: '자산가치법',
    equity_value: Math.round(nav),
    enterprise_value: Math.round(nav + adjustedLiabilities),
    details: {
      original_assets: totalAssets,
      adjusted_assets: Math.round(adjustedAssets),
      original_liabilities: totalLiabilities,
      adjusted_liabilities: Math.round(adjustedLiabilities),
      liquidation_cost: Math.round(liquidationCost),
    },
  };
}
