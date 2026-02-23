import { BaseSolver } from '../base-solver.js';
import type { CrackResult, EncryptOptions, EncryptResult, SolverOptions } from '../../types.js';
import { scorePlaintext } from '../../analysis/scoring.js';

export class AtbashSolver extends BaseSolver {
  readonly cipherType = 'atbash' as const;
  override readonly canEncrypt = true;

  async solve(ciphertext: string, _options?: SolverOptions): Promise<CrackResult[]> {
    try {
      const plaintext = this.decrypt(ciphertext);
      const score = scorePlaintext(plaintext).total;

      return [this.makeResult(plaintext, score, undefined, { method: 'atbash' })];
    } catch {
      return [];
    }
  }

  async encrypt(plaintext: string, _options?: EncryptOptions): Promise<EncryptResult> {
    // Atbash is self-inverse
    return this.makeEncryptResult(this.decrypt(plaintext), undefined, { method: 'atbash' });
  }

  private decrypt(text: string): string {
    let result = '';
    for (const ch of text) {
      const code = ch.charCodeAt(0);
      if (code >= 65 && code <= 90) {
        // Uppercase: A(65) -> Z(90), B(66) -> Y(89), etc.
        result += String.fromCharCode(90 - (code - 65));
      } else if (code >= 97 && code <= 122) {
        // Lowercase: a(97) -> z(122), b(98) -> y(121), etc.
        result += String.fromCharCode(122 - (code - 97));
      } else {
        result += ch;
      }
    }
    return result;
  }
}
