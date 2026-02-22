import { ENGLISH_WORDS } from '../data/words.js';

/**
 * Calculate ratio of text covered by recognized English words.
 * Splits on whitespace and punctuation, checks each token.
 * Returns 0–1.
 */
export function dictionaryWordRatio(text: string): number {
  if (text.length === 0) return 0;

  const tokens = text
    .toLowerCase()
    .split(/[\s,.!?;:'"()\[\]{}\-\/\\]+/)
    .filter(t => t.length > 0);

  if (tokens.length === 0) return 0;

  let matchedChars = 0;
  let totalChars = 0;

  for (const token of tokens) {
    const clean = token.replace(/[^a-z]/g, '');
    if (clean.length === 0) continue;
    totalChars += clean.length;
    if (ENGLISH_WORDS.has(clean)) {
      matchedChars += clean.length;
    }
  }

  return totalChars > 0 ? matchedChars / totalChars : 0;
}

/**
 * Check if text looks like English based on word coverage.
 * Returns true if > 50% of words are recognized English words.
 */
export function isLikelyEnglish(text: string): boolean {
  return dictionaryWordRatio(text) > 0.5;
}
