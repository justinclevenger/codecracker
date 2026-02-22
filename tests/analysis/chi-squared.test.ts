import { describe, it, expect } from 'vitest';
import { chiSquaredVsEnglish, chiSquaredScore } from '../../src/analysis/chi-squared.js';

describe('chi-squared', () => {
  it('gives lower chi-squared for English text', () => {
    const english = chiSquaredVsEnglish('the quick brown fox jumps over the lazy dog');
    const random = chiSquaredVsEnglish('zzzzqqqjjjxxxxx');
    expect(english).toBeLessThan(random);
  });

  it('gives higher score for English text', () => {
    const score = chiSquaredScore('the quick brown fox jumps over the lazy dog');
    expect(score).toBeGreaterThan(0.1);
  });

  it('handles empty text', () => {
    expect(chiSquaredVsEnglish('')).toBe(Infinity);
    expect(chiSquaredScore('')).toBe(0);
  });
});
