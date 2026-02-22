import { describe, it, expect } from 'vitest';
import { dictionaryWordRatio, isLikelyEnglish } from '../../src/analysis/dictionary.js';

describe('dictionary', () => {
  it('recognizes English text', () => {
    const ratio = dictionaryWordRatio('the quick brown fox jumps over the lazy dog');
    expect(ratio).toBeGreaterThan(0.5);
  });

  it('returns low ratio for gibberish', () => {
    const ratio = dictionaryWordRatio('xyzzy foobar bazqux');
    expect(ratio).toBeLessThan(0.3);
  });

  it('isLikelyEnglish returns true for English', () => {
    expect(isLikelyEnglish('hello world this is a test')).toBe(true);
  });

  it('isLikelyEnglish returns false for gibberish', () => {
    expect(isLikelyEnglish('xyzzy plugh foobar')).toBe(false);
  });

  it('handles empty text', () => {
    expect(dictionaryWordRatio('')).toBe(0);
  });
});
