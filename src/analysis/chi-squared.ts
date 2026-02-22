import { ENGLISH_LETTER_FREQ } from '../data/frequencies.js';
import { letterCounts, alphaOnly } from '../utils/text.js';
import { chiSquared } from '../utils/math.js';

/**
 * Chi-squared statistic of letter distribution vs English.
 * Lower = better fit. 0 = perfect match.
 */
export function chiSquaredVsEnglish(text: string): number {
  const clean = alphaOnly(text);
  const total = clean.length;
  if (total === 0) return Infinity;

  const observed = letterCounts(text);
  const expected = Object.values(ENGLISH_LETTER_FREQ).map(f => f * total);

  return chiSquared(observed, expected);
}

/**
 * Normalized chi-squared score (0–1, 1 = good English fit).
 */
export function chiSquaredScore(text: string): number {
  const chi = chiSquaredVsEnglish(text);
  const total = alphaOnly(text).length;
  if (total === 0) return 0;
  // Normalize per letter, typical English ≈ 1-2 per letter
  const perLetter = chi / total;
  return Math.max(0, Math.exp(-perLetter / 2));
}
