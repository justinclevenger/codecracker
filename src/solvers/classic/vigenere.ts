import { BaseSolver } from '../base-solver.js';
import type { CrackResult, SolverOptions } from '../../types.js';
import { scorePlaintext } from '../../analysis/scoring.js';
import { chiSquaredVsEnglish } from '../../analysis/chi-squared.js';
import { letterCounts } from '../../utils/text.js';
import { mod } from '../../utils/math.js';

export class VigenereSolver extends BaseSolver {
  readonly cipherType = 'vigenere' as const;

  async solve(ciphertext: string, options?: SolverOptions): Promise<CrackResult[]> {
    try {
      const maxResults = options?.maxResults ?? 5;

      if (options?.key && typeof options.key === 'string') {
        const key = options.key.toLowerCase();
        const plaintext = this.decrypt(ciphertext, key);
        const score = scorePlaintext(plaintext).total;
        return [this.makeResult(plaintext, score, key, { keyLength: key.length })];
      }

      // No key provided: attempt to crack
      const alphaChars = ciphertext.replace(/[^a-zA-Z]/g, '').toLowerCase();
      if (alphaChars.length < 10) {
        return [];
      }

      const likelyKeyLengths = this.kasiskiExamination(alphaChars);
      const scored: { plaintext: string; score: number; key: string }[] = [];

      for (const keyLength of likelyKeyLengths) {
        const key = this.findKeyByFrequencyAnalysis(alphaChars, keyLength);
        const plaintext = this.decrypt(ciphertext, key);
        const score = scorePlaintext(plaintext).total;
        scored.push({ plaintext, score, key });
      }

      scored.sort((a, b) => b.score - a.score);

      return scored.slice(0, maxResults).map(({ plaintext, score, key }) =>
        this.makeResult(plaintext, score, key, { keyLength: key.length }),
      );
    } catch {
      return [];
    }
  }

  private decrypt(text: string, key: string): string {
    let result = '';
    let keyIndex = 0;
    for (const ch of text) {
      const code = ch.charCodeAt(0);
      if (code >= 65 && code <= 90) {
        const shift = key.charCodeAt(keyIndex % key.length) - 97;
        result += String.fromCharCode(mod(code - 65 - shift, 26) + 65);
        keyIndex++;
      } else if (code >= 97 && code <= 122) {
        const shift = key.charCodeAt(keyIndex % key.length) - 97;
        result += String.fromCharCode(mod(code - 97 - shift, 26) + 97);
        keyIndex++;
      } else {
        result += ch;
      }
    }
    return result;
  }

  /**
   * Kasiski examination: find repeated trigrams and compute GCDs of distances
   * to determine likely key lengths.
   */
  private kasiskiExamination(text: string): number[] {
    const trigramPositions = new Map<string, number[]>();

    for (let i = 0; i <= text.length - 3; i++) {
      const trigram = text.slice(i, i + 3);
      if (!trigramPositions.has(trigram)) {
        trigramPositions.set(trigram, []);
      }
      trigramPositions.get(trigram)!.push(i);
    }

    // Collect distances between repeated trigrams
    const distances: number[] = [];
    for (const positions of trigramPositions.values()) {
      if (positions.length < 2) continue;
      for (let i = 0; i < positions.length - 1; i++) {
        for (let j = i + 1; j < positions.length; j++) {
          distances.push(positions[j] - positions[i]);
        }
      }
    }

    if (distances.length === 0) {
      // Fallback: try all key lengths 2-10
      return [2, 3, 4, 5, 6, 7, 8, 9, 10];
    }

    // Count factor frequencies for key lengths 2-20
    const factorCounts = new Map<number, number>();
    for (const dist of distances) {
      for (let f = 2; f <= 20; f++) {
        if (dist % f === 0) {
          factorCounts.set(f, (factorCounts.get(f) ?? 0) + 1);
        }
      }
    }

    // Sort by frequency (most common factors are most likely key lengths)
    const sorted = [...factorCounts.entries()].sort((a, b) => b[1] - a[1]);

    // Return top key lengths (up to 8 candidates)
    return sorted.slice(0, 8).map(([keyLen]) => keyLen);
  }

  /**
   * For a given key length, determine the key by frequency analysis on each column.
   * For each column, try all 26 shifts and pick the one with the lowest
   * chi-squared statistic vs English letter frequencies.
   */
  private findKeyByFrequencyAnalysis(text: string, keyLength: number): string {
    let key = '';

    for (let col = 0; col < keyLength; col++) {
      // Extract every keyLength-th character starting at col
      let column = '';
      for (let i = col; i < text.length; i += keyLength) {
        column += text[i];
      }

      let bestShift = 0;
      let bestChi = Infinity;

      for (let shift = 0; shift < 26; shift++) {
        // Decrypt this column with the given shift
        let decrypted = '';
        for (const ch of column) {
          decrypted += String.fromCharCode(mod(ch.charCodeAt(0) - 97 - shift, 26) + 97);
        }

        const chi = chiSquaredVsEnglish(decrypted);
        if (chi < bestChi) {
          bestChi = chi;
          bestShift = shift;
        }
      }

      key += String.fromCharCode(bestShift + 97);
    }

    return key;
  }
}
