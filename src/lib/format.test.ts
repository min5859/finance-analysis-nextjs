import { describe, it, expect } from 'vitest';
import { calcDelta, latest, previous, convertToBillion, formatPercent, formatMultiple, formatDays } from './format';

describe('format helpers', () => {
  describe('latest / previous', () => {
    it('returns last element', () => {
      expect(latest([1, 2, 3])).toBe(3);
      expect(previous([1, 2, 3])).toBe(2);
    });
    it('returns 0 fallbacks on empty arrays', () => {
      expect(latest([])).toBe(0);
      expect(previous([])).toBe(0);
    });
    it('previous returns 0 when only one element', () => {
      expect(previous([5])).toBe(0);
    });
  });

  describe('calcDelta', () => {
    it('returns null for too-short input', () => {
      expect(calcDelta([])).toBeNull();
      expect(calcDelta([1])).toBeNull();
    });
    it('returns last - prev', () => {
      expect(calcDelta([10, 15])).toBe(5);
      expect(calcDelta([10, 8, 7])).toBe(-1);
    });
  });

  describe('convertToBillion', () => {
    it('rounds 원 to 억원', () => {
      expect(convertToBillion('100000000')).toBe(1);
      expect(convertToBillion('1,234,567,890,000')).toBe(12346);
    });
    it('treats empty / dash / NaN as 0', () => {
      expect(convertToBillion('')).toBe(0);
      expect(convertToBillion('-')).toBe(0);
      expect(convertToBillion('abc')).toBe(0);
    });
  });

  describe('formatters', () => {
    it('one decimal percent', () => {
      expect(formatPercent(4.567)).toBe('4.6%');
    });
    it('two decimal multiple', () => {
      expect(formatMultiple(1.234)).toBe('1.23배');
    });
    it('one decimal days', () => {
      expect(formatDays(36.78)).toBe('36.8일');
    });
  });
});
