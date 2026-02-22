/**
 * Calculate Shannon entropy of text in bits per character.
 * English text ≈ 4.0, random bytes ≈ 7.5–8.0.
 */
export function shannonEntropy(text: string): number {
  if (text.length === 0) return 0;

  const freq = new Map<string, number>();
  for (const ch of text) {
    freq.set(ch, (freq.get(ch) ?? 0) + 1);
  }

  let entropy = 0;
  const len = text.length;
  for (const count of freq.values()) {
    const p = count / len;
    if (p > 0) {
      entropy -= p * Math.log2(p);
    }
  }
  return entropy;
}

/**
 * Score entropy relative to English text expectations.
 * Returns 0–1 (1 = entropy close to English ~4.0).
 */
export function entropyScore(text: string): number {
  const e = shannonEntropy(text);
  // English prose entropy ≈ 3.5–4.5
  // Optimal center at 4.0, decay away from it
  const diff = Math.abs(e - 4.0);
  return Math.max(0, 1 - diff / 4.0);
}
