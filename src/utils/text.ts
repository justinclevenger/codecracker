/**
 * Extract only alphabetic characters, lowercased.
 */
export function alphaOnly(text: string): string {
  return text.replace(/[^a-zA-Z]/g, '').toLowerCase();
}

/**
 * Count occurrences of each lowercase letter.
 */
export function letterCounts(text: string): number[] {
  const counts = new Array(26).fill(0);
  for (const ch of text.toLowerCase()) {
    const code = ch.charCodeAt(0) - 97;
    if (code >= 0 && code < 26) {
      counts[code]++;
    }
  }
  return counts;
}

/**
 * Get letter frequency distribution (proportions) from text.
 */
export function letterFrequencies(text: string): number[] {
  const counts = letterCounts(text);
  const total = counts.reduce((a, b) => a + b, 0);
  if (total === 0) return counts;
  return counts.map(c => c / total);
}

/**
 * Count bigrams in text (lowercase alpha only).
 */
export function bigramCounts(text: string): Map<string, number> {
  const clean = alphaOnly(text);
  const counts = new Map<string, number>();
  for (let i = 0; i < clean.length - 1; i++) {
    const bigram = clean.slice(i, i + 2);
    counts.set(bigram, (counts.get(bigram) ?? 0) + 1);
  }
  return counts;
}

/**
 * Ratio of printable ASCII characters in text.
 */
export function printableRatio(text: string): number {
  if (text.length === 0) return 0;
  let count = 0;
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code >= 32 && code <= 126) count++;
  }
  return count / text.length;
}

/**
 * Frequency of spaces in text.
 */
export function spaceFrequency(text: string): number {
  if (text.length === 0) return 0;
  let count = 0;
  for (const ch of text) {
    if (ch === ' ') count++;
  }
  return count / text.length;
}
