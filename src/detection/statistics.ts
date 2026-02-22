import { ENGLISH_IOC, RANDOM_IOC } from '../data/frequencies.js';
import { alphaOnly, letterCounts } from '../utils/text.js';
import { gcd } from '../utils/math.js';

/**
 * Index of Coincidence: probability that two randomly chosen letters are the same.
 * English ≈ 0.0667, random ≈ 0.0385.
 */
export function indexOfCoincidence(text: string): number {
  const counts = letterCounts(text);
  const n = counts.reduce((a, b) => a + b, 0);
  if (n < 2) return 0;

  let sum = 0;
  for (const c of counts) {
    sum += c * (c - 1);
  }
  return sum / (n * (n - 1));
}

/**
 * Determine if text is likely monoalphabetic (IoC close to English)
 * or polyalphabetic (IoC closer to random).
 */
export function classifyByIoC(text: string): 'monoalphabetic' | 'polyalphabetic' | 'unknown' {
  const ioc = indexOfCoincidence(text);
  const monoThreshold = (ENGLISH_IOC + RANDOM_IOC) / 2; // ~0.0526
  if (ioc > monoThreshold + 0.005) return 'monoalphabetic';
  if (ioc < monoThreshold - 0.005) return 'polyalphabetic';
  return 'unknown';
}

/**
 * Kasiski examination: find repeated trigrams and compute distances
 * to estimate Vigenere key length.
 * Returns array of likely key lengths sorted by frequency.
 */
export function kasiskiExamination(text: string, maxKeyLen = 20): number[] {
  const clean = alphaOnly(text);
  if (clean.length < 20) return [];

  // Find repeated trigrams and their positions
  const trigramPositions = new Map<string, number[]>();
  for (let i = 0; i <= clean.length - 3; i++) {
    const trigram = clean.slice(i, i + 3);
    const positions = trigramPositions.get(trigram);
    if (positions) {
      positions.push(i);
    } else {
      trigramPositions.set(trigram, [i]);
    }
  }

  // Compute distances between repeated trigrams
  const distances: number[] = [];
  for (const positions of trigramPositions.values()) {
    if (positions.length < 2) continue;
    for (let i = 0; i < positions.length - 1; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        distances.push(positions[j] - positions[i]);
      }
    }
  }

  if (distances.length === 0) return [];

  // Count factors of distances (2..maxKeyLen)
  const factorCounts = new Map<number, number>();
  for (const d of distances) {
    for (let f = 2; f <= Math.min(maxKeyLen, d); f++) {
      if (d % f === 0) {
        factorCounts.set(f, (factorCounts.get(f) ?? 0) + 1);
      }
    }
  }

  // Sort by frequency
  return [...factorCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([factor]) => factor);
}

/**
 * Estimate key length using IoC on sub-sequences.
 * For each candidate key length, split text into columns and average IoC.
 * The key length that produces IoC closest to English is likely correct.
 */
export function estimateKeyLengthByIoC(text: string, maxKeyLen = 20): number[] {
  const clean = alphaOnly(text);
  if (clean.length < 20) return [];

  const results: Array<{ keyLen: number; avgIoC: number }> = [];

  for (let keyLen = 2; keyLen <= Math.min(maxKeyLen, clean.length / 3); keyLen++) {
    let totalIoC = 0;
    for (let col = 0; col < keyLen; col++) {
      let column = '';
      for (let i = col; i < clean.length; i += keyLen) {
        column += clean[i];
      }
      totalIoC += indexOfCoincidence(column);
    }
    const avgIoC = totalIoC / keyLen;
    results.push({ keyLen, avgIoC });
  }

  // Sort by how close avgIoC is to English IoC
  return results
    .sort((a, b) => Math.abs(a.avgIoC - ENGLISH_IOC) - Math.abs(b.avgIoC - ENGLISH_IOC))
    .map(r => r.keyLen);
}
