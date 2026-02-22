import { BaseSolver } from '../base-solver.js';
import type { CrackResult, SolverOptions } from '../../types.js';
import { scorePlaintext } from '../../analysis/scoring.js';

export class Rot13Solver extends BaseSolver {
  readonly cipherType = 'rot13' as const;

  async solve(ciphertext: string, _options?: SolverOptions): Promise<CrackResult[]> {
    try {
      const plaintext = this.decrypt(ciphertext);
      const score = scorePlaintext(plaintext).total;

      return [this.makeResult(plaintext, score, 13, { shift: 13 })];
    } catch {
      return [];
    }
  }

  private decrypt(text: string): string {
    let result = '';
    for (const ch of text) {
      const code = ch.charCodeAt(0);
      if (code >= 65 && code <= 90) {
        // Uppercase
        result += String.fromCharCode(((code - 65 + 13) % 26) + 65);
      } else if (code >= 97 && code <= 122) {
        // Lowercase
        result += String.fromCharCode(((code - 97 + 13) % 26) + 97);
      } else {
        result += ch;
      }
    }
    return result;
  }
}
