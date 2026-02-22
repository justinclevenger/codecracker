import { describe, it, expect } from 'vitest';
import { shannonEntropy, entropyScore } from '../../src/analysis/entropy.js';

describe('entropy', () => {
  it('calculates entropy of English text around 3.5-4.5', () => {
    const e = shannonEntropy('the quick brown fox jumps over the lazy dog');
    expect(e).toBeGreaterThan(3.0);
    expect(e).toBeLessThan(5.0);
  });

  it('returns 0 for empty string', () => {
    expect(shannonEntropy('')).toBe(0);
  });

  it('returns high entropy for diverse characters', () => {
    const e = shannonEntropy('abcdefghijklmnopqrstuvwxyz0123456789!@#$%');
    expect(e).toBeGreaterThan(5.0);
  });

  it('scores English-like entropy highly', () => {
    const score = entropyScore('the quick brown fox jumps over the lazy dog');
    expect(score).toBeGreaterThan(0.5);
  });
});
