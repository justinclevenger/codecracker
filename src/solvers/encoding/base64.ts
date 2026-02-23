import { BaseSolver } from '../base-solver.js';
import type { CrackResult, EncryptOptions, EncryptResult, SolverOptions } from '../../types.js';

export class Base64Solver extends BaseSolver {
  readonly cipherType = 'base64' as const;
  override readonly canEncrypt = true;

  async solve(ciphertext: string, _options?: SolverOptions): Promise<CrackResult[]> {
    const input = ciphertext.trim();

    if (!this.isBase64(input)) {
      return [];
    }

    try {
      const decoded = Buffer.from(input, 'base64').toString('utf-8');

      if (decoded.length === 0) {
        return [];
      }

      const printableRatio = this.getPrintableRatio(decoded);

      if (printableRatio < 0.8) {
        return [];
      }

      const confidence = Math.min(printableRatio, 1);

      return [this.makeResult(decoded, confidence, undefined, { encoding: 'base64' })];
    } catch {
      return [];
    }
  }

  async encrypt(plaintext: string, _options?: EncryptOptions): Promise<EncryptResult> {
    const ciphertext = Buffer.from(plaintext, 'utf-8').toString('base64');
    return this.makeEncryptResult(ciphertext, undefined, { encoding: 'base64' });
  }

  private isBase64(input: string): boolean {
    if (input.length === 0) {
      return false;
    }

    // Length (including padding) must be a multiple of 4
    if (input.length % 4 !== 0) {
      return false;
    }

    return /^[A-Za-z0-9+/]+=*$/.test(input);
  }

  private getPrintableRatio(text: string): number {
    if (text.length === 0) {
      return 0;
    }

    let printable = 0;
    for (const char of text) {
      const code = char.charCodeAt(0);
      // Printable ASCII: space (32) through tilde (126), plus common whitespace
      if ((code >= 32 && code <= 126) || code === 9 || code === 10 || code === 13) {
        printable++;
      }
    }

    return printable / text.length;
  }
}
