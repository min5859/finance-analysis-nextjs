import { describe, it, expect } from 'vitest';
import { estimateCostUsd } from './pricing';

describe('estimateCostUsd', () => {
  it('uses exact model price when known', () => {
    // gpt-4o: $2.5 / $10 per 1M
    const cost = estimateCostUsd('openai', 'gpt-4o', 1_000_000, 1_000_000);
    expect(cost).toBeCloseTo(12.5, 4);
  });

  it('matches by prefix on datestamped model names', () => {
    // claude-sonnet-4-20250514 → claude-sonnet-4 ($3 / $15)
    const cost = estimateCostUsd('anthropic', 'claude-sonnet-4-20250514', 1_000_000, 1_000_000);
    expect(cost).toBeCloseTo(18, 4);
  });

  it('falls back to provider default when model is unknown', () => {
    // gemini default ($0.1 / $0.4)
    const cost = estimateCostUsd('gemini', 'gemini-experimental-new-thing', 1_000_000, 1_000_000);
    expect(cost).toBeCloseTo(0.5, 4);
  });

  it('returns 0 when both token counts are 0', () => {
    expect(estimateCostUsd('anthropic', 'claude-sonnet-4', 0, 0)).toBe(0);
  });
});
