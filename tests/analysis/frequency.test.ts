import { describe, it, expect } from 'vitest';
import { letterFrequencyFit, bigramFrequencyFit } from '../../src/analysis/frequency.js';

describe('frequency analysis', () => {
  it('scores English text higher than random', () => {
    const english = letterFrequencyFit('The quick brown fox jumps over the lazy dog');
    const random = letterFrequencyFit('xzqjk vbmwp nrtgh');
    expect(english).toBeGreaterThan(random);
    expect(english).toBeGreaterThan(0.1);
  });

  it('scores random text poorly', () => {
    const score = letterFrequencyFit('xzqjk vbmwp');
    expect(score).toBeLessThan(0.3);
  });

  it('handles empty text', () => {
    expect(letterFrequencyFit('')).toBe(0);
  });

  it('scores bigram fit for English higher than random', () => {
    const english = bigramFrequencyFit('the quick brown fox jumps over the lazy dog and that is all');
    const random = bigramFrequencyFit('xzqjk vbmwp nrtgh lfyxz qwmkp');
    expect(english).toBeGreaterThan(random);
    expect(english).toBeGreaterThan(0.1);
  });
});
