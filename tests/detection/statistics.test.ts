import { describe, it, expect } from 'vitest';
import { indexOfCoincidence, classifyByIoC, kasiskiExamination } from '../../src/detection/statistics.js';

describe('statistics', () => {
  describe('indexOfCoincidence', () => {
    it('returns ~0.065 for English text', () => {
      // Need a longer text for reliable IoC — short pangrams have too uniform a distribution
      const text = 'to be or not to be that is the question whether it is nobler in the mind to suffer the slings and arrows of outrageous fortune or to take arms against a sea of troubles and by opposing end them to die to sleep no more and by a sleep to say we end the heartache and the thousand natural shocks that flesh is heir to';
      const ioc = indexOfCoincidence(text);
      expect(ioc).toBeGreaterThan(0.05);
      expect(ioc).toBeLessThan(0.09);
    });

    it('returns 0 for empty or single-char text', () => {
      expect(indexOfCoincidence('')).toBe(0);
      expect(indexOfCoincidence('a')).toBe(0);
    });
  });

  describe('classifyByIoC', () => {
    it('classifies English-like text as monoalphabetic', () => {
      const text = 'to be or not to be that is the question whether it is nobler in the mind to suffer the slings and arrows of outrageous fortune or to take arms against a sea of troubles and by opposing end them to die to sleep no more and by a sleep to say we end the heartache and the thousand natural shocks that flesh is heir to';
      expect(classifyByIoC(text)).toBe('monoalphabetic');
    });
  });

  describe('kasiskiExamination', () => {
    it('returns possible key lengths', () => {
      // Create a simple Vigenere-encrypted text with key length 3
      const lengths = kasiskiExamination('abcabcabcdefdefdefghighighi');
      expect(lengths.length).toBeGreaterThan(0);
      expect(lengths).toContain(3);
    });

    it('returns empty for short text', () => {
      expect(kasiskiExamination('abc')).toEqual([]);
    });
  });
});
