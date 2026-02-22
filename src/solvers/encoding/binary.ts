import { BaseSolver } from '../base-solver.js';
import type { CrackResult, SolverOptions } from '../../types.js';

export class BinarySolver extends BaseSolver {
  readonly cipherType = 'binary' as const;

  async solve(ciphertext: string, _options?: SolverOptions): Promise<CrackResult[]> {
    const input = ciphertext.trim();

    if (!this.isBinary(input)) {
      return [];
    }

    try {
      const decoded = this.decodeBinary(input);

      if (decoded.length === 0) {
        return [];
      }

      const printableRatio = this.getPrintableRatio(decoded);

      if (printableRatio < 0.8) {
        return [];
      }

      const confidence = Math.min(printableRatio, 1);

      return [this.makeResult(decoded, confidence, undefined, { encoding: 'binary' })];
    } catch {
      return [];
    }
  }

  private isBinary(input: string): boolean {
    if (input.length === 0) {
      return false;
    }

    return /^[01\s]+$/.test(input);
  }

  private decodeBinary(input: string): string {
    // Remove all whitespace and split into 8-bit groups
    const bits = input.replace(/\s+/g, '');

    if (bits.length % 8 !== 0) {
      return '';
    }

    let result = '';
    for (let i = 0; i < bits.length; i += 8) {
      const byte = bits.slice(i, i + 8);
      const charCode = parseInt(byte, 2);
      result += String.fromCharCode(charCode);
    }

    return result;
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
