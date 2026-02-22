import type { CipherType, DetectionCandidate } from '../types.js';
import { detectByPattern } from './patterns.js';
import { analyzeCharset } from './charset.js';
import { indexOfCoincidence, classifyByIoC, kasiskiExamination } from './statistics.js';
import { shannonEntropy } from '../analysis/entropy.js';
import { ENGLISH_IOC } from '../data/frequencies.js';

/**
 * Run all detection heuristics and return ranked cipher candidates.
 */
export function detect(ciphertext: string): DetectionCandidate[] {
  if (!ciphertext || ciphertext.trim().length === 0) {
    return [];
  }

  const trimmed = ciphertext.trim();

  // Phase 1: Fast pattern-based detection
  const patternCandidates = detectByPattern(trimmed);

  // Phase 2: Statistical analysis for ambiguous cases
  const charset = analyzeCharset(trimmed);
  const statCandidates: DetectionCandidate[] = [];

  // Only run statistical analysis on alphabetic text
  if (charset.alphaRatio > 0.7 && charset.totalChars >= 20) {
    const ioc = indexOfCoincidence(trimmed);
    const entropy = shannonEntropy(trimmed);
    const classification = classifyByIoC(trimmed);

    if (classification === 'polyalphabetic') {
      // Likely Vigenere or similar polyalphabetic cipher
      const keyLengths = kasiskiExamination(trimmed);
      const vigConf = Math.min(0.7, 0.3 + keyLengths.length * 0.05);
      statCandidates.push({
        cipherType: 'vigenere',
        confidence: vigConf,
        details: { ioc, classification, likelyKeyLengths: keyLengths.slice(0, 5) },
      });
    } else if (classification === 'monoalphabetic') {
      // Could be Caesar, substitution, or other monoalphabetic
      statCandidates.push(
        {
          cipherType: 'caesar',
          confidence: 0.4,
          details: { ioc, classification },
        },
        {
          cipherType: 'substitution',
          confidence: 0.35,
          details: { ioc, classification },
        },
        {
          cipherType: 'rot13',
          confidence: 0.3,
          details: { ioc, classification },
        },
        {
          cipherType: 'atbash',
          confidence: 0.25,
          details: { ioc, classification },
        },
      );
    }

    // XOR with repeated key can look like random
    if (entropy > 5.0) {
      statCandidates.push({
        cipherType: 'xor',
        confidence: 0.2,
        details: { entropy, reason: 'High entropy suggests encryption or XOR' },
      });
    }
  }

  // Merge candidates: take the higher confidence for each cipher type
  const merged = new Map<CipherType, DetectionCandidate>();

  for (const candidate of [...patternCandidates, ...statCandidates]) {
    const existing = merged.get(candidate.cipherType);
    if (!existing || candidate.confidence > existing.confidence) {
      merged.set(candidate.cipherType, candidate);
    }
  }

  // Sort by confidence descending
  return [...merged.values()].sort((a, b) => b.confidence - a.confidence);
}
