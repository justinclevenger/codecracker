import { BaseSolver } from '../base-solver.js';
import type { CrackResult, SolverOptions } from '../../types.js';
import { scorePlaintext } from '../../analysis/scoring.js';

export class XorSolver extends BaseSolver {
  readonly cipherType = 'xor' as const;

  async solve(ciphertext: string, options?: SolverOptions): Promise<CrackResult[]> {
    const input = ciphertext.trim();

    if (input.length === 0) {
      return [];
    }

    const inputBytes = this.toBytes(input);

    if (inputBytes.length === 0) {
      return [];
    }

    // If a key is provided, decrypt with that key directly
    if (options?.key) {
      return this.decryptWithKey(inputBytes, options.key);
    }

    // No key provided: brute-force single-byte XOR
    return this.bruteForceSingleByte(inputBytes);
  }

  private decryptWithKey(inputBytes: Buffer, key: string | Buffer): CrackResult[] {
    try {
      const keyBytes = Buffer.isBuffer(key) ? key : Buffer.from(key, 'utf-8');

      if (keyBytes.length === 0) {
        return [];
      }

      const decrypted = this.xorWithKey(inputBytes, keyBytes);
      const plaintext = decrypted.toString('utf-8');
      const score = scorePlaintext(plaintext);
      const keyDisplay = Buffer.isBuffer(key) ? key.toString('hex') : key;

      return [this.makeResult(plaintext, score.total, keyDisplay, {
        method: 'known-key',
        keyLength: keyBytes.length,
      })];
    } catch {
      return [];
    }
  }

  private bruteForceSingleByte(inputBytes: Buffer): CrackResult[] {
    const candidates: Array<{ plaintext: string; score: number; keyByte: number }> = [];

    for (let keyByte = 0x01; keyByte <= 0xff; keyByte++) {
      try {
        const decrypted = Buffer.alloc(inputBytes.length);

        for (let i = 0; i < inputBytes.length; i++) {
          decrypted[i] = inputBytes[i]! ^ keyByte;
        }

        const plaintext = decrypted.toString('utf-8');
        const score = scorePlaintext(plaintext);

        candidates.push({ plaintext, score: score.total, keyByte });
      } catch {
        // Skip invalid decryptions
      }
    }

    // Sort by score descending and take top 5
    candidates.sort((a, b) => b.score - a.score);
    const top = candidates.slice(0, 5);

    return top.map((candidate) =>
      this.makeResult(candidate.plaintext, candidate.score, `0x${candidate.keyByte.toString(16).padStart(2, '0')}`, {
        method: 'single-byte-bruteforce',
        keyByte: candidate.keyByte,
      }),
    );
  }

  private xorWithKey(data: Buffer, key: Buffer): Buffer {
    const result = Buffer.alloc(data.length);

    for (let i = 0; i < data.length; i++) {
      result[i] = data[i]! ^ key[i % key.length]!;
    }

    return result;
  }

  private toBytes(input: string): Buffer {
    // Try hex decode first if input looks like a hex string
    const stripped = input.replace(/\s+/g, '');

    if (this.isHex(stripped)) {
      return Buffer.from(stripped, 'hex');
    }

    // Otherwise treat as raw bytes (UTF-8)
    return Buffer.from(input, 'utf-8');
  }

  private isHex(input: string): boolean {
    if (input.length === 0 || input.length % 2 !== 0) {
      return false;
    }

    return /^[0-9a-fA-F]+$/.test(input);
  }
}
