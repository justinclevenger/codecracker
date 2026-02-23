import { BaseSolver } from '../base-solver.js';
import type { CrackResult, EncryptOptions, EncryptResult, SolverOptions } from '../../types.js';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export class Base32Solver extends BaseSolver {
  readonly cipherType = 'base32' as const;
  override readonly canEncrypt = true;

  async solve(ciphertext: string, _options?: SolverOptions): Promise<CrackResult[]> {
    const input = ciphertext.trim().toUpperCase();

    if (!this.isBase32(input)) {
      return [];
    }

    try {
      const decoded = this.decodeBase32(input);

      if (decoded.length === 0) {
        return [];
      }

      const printableRatio = this.getPrintableRatio(decoded);

      if (printableRatio < 0.8) {
        return [];
      }

      const confidence = Math.min(printableRatio, 1);

      return [this.makeResult(decoded, confidence, undefined, { encoding: 'base32' })];
    } catch {
      return [];
    }
  }

  async encrypt(plaintext: string, _options?: EncryptOptions): Promise<EncryptResult> {
    const bytes = Buffer.from(plaintext, 'utf-8');
    let bits = '';
    for (let i = 0; i < bytes.length; i++) {
      bits += bytes[i].toString(2).padStart(8, '0');
    }
    let result = '';
    for (let i = 0; i < bits.length; i += 5) {
      const chunk = bits.slice(i, i + 5).padEnd(5, '0');
      result += BASE32_ALPHABET[parseInt(chunk, 2)];
    }
    // Add padding
    while (result.length % 8 !== 0) {
      result += '=';
    }
    return this.makeEncryptResult(result, undefined, { encoding: 'base32' });
  }

  private isBase32(input: string): boolean {
    if (input.length === 0) {
      return false;
    }

    // Base32 encoded length (with padding) must be a multiple of 8
    if (input.length % 8 !== 0) {
      return false;
    }

    return /^[A-Z2-7]+=*$/.test(input);
  }

  private decodeBase32(input: string): string {
    // Strip padding
    const stripped = input.replace(/=+$/, '');

    let bits = '';
    for (const char of stripped) {
      const index = BASE32_ALPHABET.indexOf(char);
      if (index === -1) {
        throw new Error(`Invalid base32 character: ${char}`);
      }
      bits += index.toString(2).padStart(5, '0');
    }

    const bytes: number[] = [];
    for (let i = 0; i + 8 <= bits.length; i += 8) {
      bytes.push(parseInt(bits.slice(i, i + 8), 2));
    }

    return Buffer.from(bytes).toString('utf-8');
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
