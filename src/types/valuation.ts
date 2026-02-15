/** AI 가치평가 결과 */
export interface ValuationResult {
  company: string;
  ebitda_valuation: ScenarioValues;
  dcf_valuation: ScenarioValues;
  assumptions: ValuationAssumptions;
  calculations: {
    ebitda_description: string;
    dcf_description: string;
  };
  summary: string;
}

export interface ScenarioValues {
  conservative: number;
  base: number;
  optimistic: number;
}

export interface ValuationAssumptions {
  ebitda_multipliers: ScenarioValues;
  discount_rates: ScenarioValues;
  growth_rates: ScenarioValues;
  terminal_growth_rates: ScenarioValues;
}
