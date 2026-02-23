import { BaseSolver } from '../base-solver.js';
import type { CrackResult, EncryptOptions, EncryptResult, SolverOptions } from '../../types.js';
import { scorePlaintext } from '../../analysis/scoring.js';

export class RailFenceSolver extends BaseSolver {
  readonly cipherType = 'rail-fence' as const;
  override readonly canEncrypt = true;

  async solve(ciphertext: string, options?: SolverOptions): Promise<CrackResult[]> {
    try {
      const maxResults = options?.maxResults ?? 5;
      const scored: { plaintext: string; score: number; rails: number }[] = [];

      for (let rails = 2; rails <= 10; rails++) {
        if (rails >= ciphertext.length) break;

        const plaintext = this.decrypt(ciphertext, rails);
        const score = scorePlaintext(plaintext).total;
        scored.push({ plaintext, score, rails });
      }

      scored.sort((a, b) => b.score - a.score);

      return scored.slice(0, maxResults).map(({ plaintext, score, rails }) =>
        this.makeResult(plaintext, score, rails, { rails }),
      );
    } catch {
      return [];
    }
  }

  async encrypt(plaintext: string, options?: EncryptOptions): Promise<EncryptResult> {
    const rails = options?.key ? parseInt(String(options.key), 10) : 3;
    if (isNaN(rails) || rails < 2) throw new Error("Cipher 'rail-fence' requires a numeric key >= 2 for encryption");
    const len = plaintext.length;
    const railRows: string[] = Array.from({ length: rails }, () => '');
    let rail = 0;
    let direction = 1;
    for (let i = 0; i < len; i++) {
      railRows[rail] += plaintext[i];
      if (rail === 0) direction = 1;
      else if (rail === rails - 1) direction = -1;
      rail += direction;
    }
    const ciphertext = railRows.join('');
    return this.makeEncryptResult(ciphertext, rails, { rails });
  }

  private decrypt(ciphertext: string, rails: number): string {
    const len = ciphertext.length;
    if (rails <= 1 || rails >= len) return ciphertext;

    // Build the zigzag pattern to determine which rail each position belongs to
    const railAssignment = new Array<number>(len);
    let rail = 0;
    let direction = 1;

    for (let i = 0; i < len; i++) {
      railAssignment[i] = rail;
      if (rail === 0) {
        direction = 1;
      } else if (rail === rails - 1) {
        direction = -1;
      }
      rail += direction;
    }

    // Count how many characters go on each rail
    const railLengths = new Array<number>(rails).fill(0);
    for (let i = 0; i < len; i++) {
      railLengths[railAssignment[i]]++;
    }

    // Split the ciphertext into chunks for each rail
    const railChars: string[][] = [];
    let offset = 0;
    for (let r = 0; r < rails; r++) {
      railChars.push(ciphertext.slice(offset, offset + railLengths[r]).split(''));
      offset += railLengths[r];
    }

    // Read off in zigzag order: for each position, take from the appropriate rail
    const railIndices = new Array<number>(rails).fill(0);
    let result = '';
    for (let i = 0; i < len; i++) {
      const r = railAssignment[i];
      result += railChars[r][railIndices[r]];
      railIndices[r]++;
    }

    return result;
  }
}
