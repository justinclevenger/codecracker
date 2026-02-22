import { ENGLISH_LETTER_FREQ, ENGLISH_BIGRAM_FREQ } from '../data/frequencies.js';
import { letterFrequencies, bigramCounts, alphaOnly } from '../utils/text.js';
import { chiSquared } from '../utils/math.js';

/**
 * Measure how well letter frequencies match English.
 * Returns 0–1 (1 = perfect match).
 */
export function letterFrequencyFit(text: string): number {
  const freqs = letterFrequencies(text);
  const expected = Object.values(ENGLISH_LETTER_FREQ);
  const totalLetters = alphaOnly(text).length;
  if (totalLetters < 2) return 0;

  const observed = freqs.map(f => f * totalLetters);
  const expectedCounts = expected.map(f => f * totalLetters);
  const chi = chiSquared(observed, expectedCounts);

  // Normalize chi-squared to 0–1 score.
  // For English text, chi/N is typically ~0.3–1.5. Random text gives chi/N > 5.
  // Use a sigmoid-like decay centered around chi/N ≈ 2.
  const chiPerLetter = chi / totalLetters;
  const normalized = Math.exp(-chiPerLetter / 3);
  return Math.min(1, Math.max(0, normalized));
}

/**
 * Measure how well bigram frequencies match English.
 * Returns 0–1 (1 = perfect match).
 */
export function bigramFrequencyFit(text: string): number {
  const counts = bigramCounts(text);
  const clean = alphaOnly(text);
  const totalBigrams = Math.max(1, clean.length - 1);

  if (totalBigrams < 5) return 0;

  let matchScore = 0;
  let totalWeight = 0;

  for (const [bigram, expectedFreq] of Object.entries(ENGLISH_BIGRAM_FREQ)) {
    const observedFreq = (counts.get(bigram) ?? 0) / totalBigrams;
    const diff = Math.abs(observedFreq - expectedFreq);
    const weight = expectedFreq;
    matchScore += weight * Math.max(0, 1 - diff / expectedFreq);
    totalWeight += weight;
  }

  return totalWeight > 0 ? matchScore / totalWeight : 0;
}
