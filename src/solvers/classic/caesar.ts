import { BaseSolver } from '../base-solver.js';
import type { CrackResult, SolverOptions } from '../../types.js';
import { scorePlaintext } from '../../analysis/scoring.js';

export class CaesarSolver extends BaseSolver {
  readonly cipherType = 'caesar' as const;

  async solve(ciphertext: string, options?: SolverOptions): Promise<CrackResult[]> {
    try {
      const maxResults = options?.maxResults ?? 5;
      const scored: { plaintext: string; score: number; shift: number }[] = [];

      for (let shift = 1; shift <= 25; shift++) {
        const plaintext = this.decrypt(ciphertext, shift);
        const score = scorePlaintext(plaintext).total;
        scored.push({ plaintext, score, shift });
      }

      scored.sort((a, b) => b.score - a.score);

      return scored.slice(0, maxResults).map(({ plaintext, score, shift }) =>
        this.makeResult(plaintext, score, shift, { shift }),
      );
    } catch {
      return [];
    }
  }

  private decrypt(text: string, shift: number): string {
    let result = '';
    for (const ch of text) {
      const code = ch.charCodeAt(0);
      if (code >= 65 && code <= 90) {
        // Uppercase
        result += String.fromCharCode(((code - 65 - shift + 26) % 26) + 65);
      } else if (code >= 97 && code <= 122) {
        // Lowercase
        result += String.fromCharCode(((code - 97 - shift + 26) % 26) + 97);
      } else {
        result += ch;
      }
    }
    return result;
  }
}
