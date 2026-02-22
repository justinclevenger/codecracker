import { BaseSolver } from '../base-solver.js';
import type { CrackResult, SolverOptions } from '../../types.js';

export class HexSolver extends BaseSolver {
  readonly cipherType = 'hex' as const;

  async solve(ciphertext: string, _options?: SolverOptions): Promise<CrackResult[]> {
    const input = ciphertext.trim().replace(/\s+/g, '');

    if (!this.isHex(input)) {
      return [];
    }

    try {
      const decoded = Buffer.from(input, 'hex').toString('utf-8');

      if (decoded.length === 0) {
        return [];
      }

      const printableRatio = this.getPrintableRatio(decoded);

      if (printableRatio < 0.8) {
        return [];
      }

      const confidence = Math.min(printableRatio, 1);

      return [this.makeResult(decoded, confidence, undefined, { encoding: 'hex' })];
    } catch {
      return [];
    }
  }

  private isHex(input: string): boolean {
    if (input.length === 0 || input.length % 2 !== 0) {
      return false;
    }

    return /^[0-9a-fA-F]+$/.test(input);
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
