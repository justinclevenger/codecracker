import { BaseSolver } from '../base-solver.js';
import type { CrackResult, SolverOptions } from '../../types.js';

export class UrlEncodingSolver extends BaseSolver {
  readonly cipherType = 'url-encoding' as const;

  async solve(ciphertext: string, _options?: SolverOptions): Promise<CrackResult[]> {
    const input = ciphertext.trim();

    if (!this.isUrlEncoded(input)) {
      return [];
    }

    try {
      const decoded = decodeURIComponent(input);

      // If nothing was actually decoded, skip
      if (decoded === input) {
        return [];
      }

      if (decoded.length === 0) {
        return [];
      }

      const printableRatio = this.getPrintableRatio(decoded);

      if (printableRatio < 0.8) {
        return [];
      }

      const confidence = Math.min(printableRatio, 1);

      return [this.makeResult(decoded, confidence, undefined, { encoding: 'url-encoding' })];
    } catch {
      return [];
    }
  }

  private isUrlEncoded(input: string): boolean {
    if (input.length === 0) {
      return false;
    }

    // Must contain at least one %XX pattern
    return /%[0-9a-fA-F]{2}/.test(input);
  }

  private getPrintableRatio(text: string): number {
    if (text.length === 0) {
      return 0;
    }

    let printable = 0;
    for (const char of text) {
      const code = char.charCodeAt(0);
      if ((code >= 32 && code <= 126) || code === 9 || code === 10 || code === 13) {
        printable++;
      }
    }

    return printable / text.length;
  }
}
