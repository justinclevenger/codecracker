import { describe, it, expect } from 'vitest';
import { dictionaryWordRatio } from '../../src/analysis/dictionary.js';
import { setDictionaryScorer, scorePlaintext, finalConfidence } from '../../src/analysis/scoring.js';

describe('scoring', () => {
  // Initialize the dictionary scorer
  setDictionaryScorer(dictionaryWordRatio);

  it('scores English text higher than gibberish', () => {
    const english = scorePlaintext('The quick brown fox jumps over the lazy dog');
    const gibberish = scorePlaintext('xzqjk vbmwp rltyf');
    expect(english.total).toBeGreaterThan(gibberish.total);
    expect(english.printableRatio).toBe(1);
    expect(english.total).toBeGreaterThan(0.2);
  });

  it('scores gibberish with low total', () => {
    const score = scorePlaintext('xzqjk vbmwp rltyf');
    expect(score.total).toBeLessThan(0.4);
  });

  it('calculates final confidence correctly', () => {
    const conf = finalConfidence(0.8, 0.9);
    expect(conf).toBeCloseTo(0.4 * 0.8 + 0.6 * 0.9);
  });

  it('clamps confidence to [0,1]', () => {
    expect(finalConfidence(2, 2)).toBeLessThanOrEqual(1);
    expect(finalConfidence(-1, -1)).toBeGreaterThanOrEqual(0);
  });
});
