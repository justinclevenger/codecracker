import { letterFrequencyFit, bigramFrequencyFit } from './frequency.js';
import { entropyScore } from './entropy.js';
import { printableRatio, spaceFrequency } from '../utils/text.js';
import type { PlaintextScore } from '../types.js';

let dictionaryWordRatioFn: ((text: string) => number) | null = null;

export function setDictionaryScorer(fn: (text: string) => number): void {
  dictionaryWordRatioFn = fn;
}

/**
 * Composite plaintext quality score.
 * 0.35 × dictionaryWordRatio + 0.25 × frequencyFit + 0.15 × bigramFit
 * + 0.10 × entropyScore + 0.10 × printableRatio + 0.05 × spaceFrequency
 */
export function scorePlaintext(text: string): PlaintextScore {
  const dictRatio = dictionaryWordRatioFn ? dictionaryWordRatioFn(text) : 0;
  const freqFit = letterFrequencyFit(text);
  const bigFit = bigramFrequencyFit(text);
  const entScore = entropyScore(text);
  const printRatio = printableRatio(text);

  // Space frequency: English ≈ 15-20%. Score peaks around 0.17.
  const sf = spaceFrequency(text);
  const spaceScore = Math.max(0, 1 - Math.abs(sf - 0.17) / 0.17);

  const total =
    0.35 * dictRatio +
    0.25 * freqFit +
    0.15 * bigFit +
    0.10 * entScore +
    0.10 * printRatio +
    0.05 * spaceScore;

  return {
    total: Math.min(1, Math.max(0, total)),
    dictionaryWordRatio: dictRatio,
    frequencyFit: freqFit,
    bigramFit: bigFit,
    entropyScore: entScore,
    printableRatio: printRatio,
    spaceFrequency: spaceScore,
  };
}

/**
 * Final confidence = 0.4 × detectionConfidence + 0.6 × plaintextQualityScore
 */
export function finalConfidence(detectionConfidence: number, plaintextQuality: number): number {
  return Math.min(1, Math.max(0, 0.4 * detectionConfidence + 0.6 * plaintextQuality));
}
