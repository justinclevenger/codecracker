import { BaseSolver } from '../base-solver.js';
import type { CrackResult, EncryptOptions, EncryptResult, SolverOptions } from '../../types.js';
import { scorePlaintext } from '../../analysis/scoring.js';

export class ColumnarTranspositionSolver extends BaseSolver {
  readonly cipherType = 'columnar-transposition' as const;
  override readonly canEncrypt = true;

  async solve(ciphertext: string, options?: SolverOptions): Promise<CrackResult[]> {
    try {
      const maxResults = options?.maxResults ?? 5;
      const scored: { plaintext: string; score: number; keyLength: number; permutation: number[] }[] = [];

      // Try key lengths 2-10, but limit permutations for performance
      const maxKeyLengthForBrute = 7;

      for (let keyLength = 2; keyLength <= 10; keyLength++) {
        if (keyLength > maxKeyLengthForBrute) {
          // For key lengths > 7, only try identity and reverse permutations
          const identity = Array.from({ length: keyLength }, (_, i) => i);
          const reverse = [...identity].reverse();

          for (const perm of [identity, reverse]) {
            const plaintext = this.decrypt(ciphertext, perm);
            const score = scorePlaintext(plaintext).total;
            scored.push({ plaintext, score, keyLength, permutation: perm });
          }
        } else {
          // Try all permutations for smaller key lengths
          const permutations = this.generatePermutations(keyLength);
          for (const perm of permutations) {
            const plaintext = this.decrypt(ciphertext, perm);
            const score = scorePlaintext(plaintext).total;
            scored.push({ plaintext, score, keyLength, permutation: perm });
          }
        }
      }

      scored.sort((a, b) => b.score - a.score);

      return scored.slice(0, maxResults).map(({ plaintext, score, keyLength, permutation }) =>
        this.makeResult(plaintext, score, keyLength, {
          keyLength,
          permutation,
        }),
      );
    } catch {
      return [];
    }
  }

  async encrypt(plaintext: string, options?: EncryptOptions): Promise<EncryptResult> {
    if (!options?.key || typeof options.key !== 'string') {
      throw new Error("Cipher 'columnar-transposition' requires a key for encryption");
    }
    // Derive permutation from keyword: sort letters alphabetically, use indices as permutation
    const keyStr = options.key.toLowerCase();
    const indexed = keyStr.split('').map((ch, i) => ({ ch, i }));
    indexed.sort((a, b) => a.ch.localeCompare(b.ch) || a.i - b.i);
    const permutation = indexed.map(item => item.i);

    const numCols = permutation.length;
    // Write plaintext row by row into columns
    const columns: string[] = Array.from({ length: numCols }, () => '');
    for (let i = 0; i < plaintext.length; i++) {
      columns[i % numCols] += plaintext[i];
    }
    // Read columns in permutation order
    let ciphertext = '';
    for (const colIdx of permutation) {
      ciphertext += columns[colIdx];
    }
    return this.makeEncryptResult(ciphertext, options.key, { keyLength: numCols, permutation });
  }

  /**
   * Decrypt columnar transposition given a column permutation order.
   * The permutation array represents the order in which columns were read
   * during encryption.
   */
  private decrypt(ciphertext: string, permutation: number[]): string {
    const numCols = permutation.length;
    const len = ciphertext.length;
    const numFullRows = Math.floor(len / numCols);
    const extraChars = len % numCols;

    // Determine the length of each column in the ciphertext
    // Columns that come earlier in the permutation order may have an extra character
    const colLengths = new Array<number>(numCols);
    for (let i = 0; i < numCols; i++) {
      // The column at permutation position i has an extra char if permutation[i] < extraChars
      // Wait -- in columnar transposition, the columns are read in permutation order.
      // Columns whose original index < extraChars have (numFullRows + 1) chars,
      // others have numFullRows.
      colLengths[i] = numFullRows + (permutation[i] < extraChars ? 1 : 0);
    }

    // Split the ciphertext into columns (in the order they appear in the ciphertext)
    const columns: string[] = [];
    let offset = 0;
    for (let i = 0; i < numCols; i++) {
      columns.push(ciphertext.slice(offset, offset + colLengths[i]));
      offset += colLengths[i];
    }

    // Map columns back to their original positions
    const originalColumns: string[] = new Array(numCols);
    for (let i = 0; i < numCols; i++) {
      originalColumns[permutation[i]] = columns[i];
    }

    // Read row by row
    let result = '';
    const maxRows = numFullRows + (extraChars > 0 ? 1 : 0);
    for (let row = 0; row < maxRows; row++) {
      for (let col = 0; col < numCols; col++) {
        if (row < originalColumns[col].length) {
          result += originalColumns[col][row];
        }
      }
    }

    return result;
  }

  /**
   * Generate all permutations of indices [0, 1, ..., n-1].
   */
  private generatePermutations(n: number): number[][] {
    const results: number[][] = [];
    const arr = Array.from({ length: n }, (_, i) => i);

    const permute = (start: number): void => {
      if (start === n) {
        results.push([...arr]);
        return;
      }
      for (let i = start; i < n; i++) {
        [arr[start], arr[i]] = [arr[i], arr[start]];
        permute(start + 1);
        [arr[start], arr[i]] = [arr[i], arr[start]];
      }
    };

    permute(0);
    return results;
  }
}
