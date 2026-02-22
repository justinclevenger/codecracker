import { BaseSolver } from '../base-solver.js';
import type { CrackResult, SolverOptions } from '../../types.js';
import { createDecipheriv } from 'node:crypto';

export class AesSolver extends BaseSolver {
  readonly cipherType = 'aes' as const;

  async solve(ciphertext: string, options?: SolverOptions): Promise<CrackResult[]> {
    if (!options?.key) {
      return [];
    }

    const input = ciphertext.trim();

    if (input.length === 0) {
      return [];
    }

    const keyBuffer = this.toKeyBuffer(options.key);

    if (keyBuffer.length !== 32) {
      return [];
    }

    const results: CrackResult[] = [];

    // Try base64 decode of the input
    const base64Result = this.tryDecrypt(
      this.tryBase64Decode(input),
      keyBuffer,
      options.iv,
      'base64',
    );

    if (base64Result) {
      results.push(base64Result);
    }

    // Try hex decode of the input
    const hexResult = this.tryDecrypt(
      this.tryHexDecode(input),
      keyBuffer,
      options.iv,
      'hex',
    );

    if (hexResult) {
      results.push(hexResult);
    }

    return results;
  }

  private tryDecrypt(
    ciphertextBytes: Buffer | null,
    key: Buffer,
    iv: string | Buffer | undefined,
    inputEncoding: string,
  ): CrackResult | null {
    if (!ciphertextBytes || ciphertextBytes.length === 0) {
      return null;
    }

    try {
      let ivBuffer: Buffer;
      let encryptedData: Buffer;

      if (iv) {
        // IV provided explicitly
        ivBuffer = Buffer.isBuffer(iv) ? iv : Buffer.from(iv, 'hex');
        encryptedData = ciphertextBytes;
      } else {
        // Assume first 16 bytes of ciphertext are the IV
        if (ciphertextBytes.length < 17) {
          return null;
        }

        ivBuffer = ciphertextBytes.subarray(0, 16);
        encryptedData = ciphertextBytes.subarray(16);
      }

      if (ivBuffer.length !== 16) {
        return null;
      }

      if (encryptedData.length === 0 || encryptedData.length % 16 !== 0) {
        return null;
      }

      const decipher = createDecipheriv('aes-256-cbc', key, ivBuffer);
      const decrypted = Buffer.concat([
        decipher.update(encryptedData),
        decipher.final(),
      ]);

      const plaintext = decrypted.toString('utf-8');

      if (plaintext.length === 0) {
        return null;
      }

      const printable = this.getPrintableRatio(plaintext);

      if (printable < 0.8) {
        return null;
      }

      return this.makeResult(plaintext, Math.min(printable, 1), undefined, {
        algorithm: 'AES-256-CBC',
        inputEncoding,
        ivSource: iv ? 'provided' : 'extracted-from-ciphertext',
      });
    } catch {
      return null;
    }
  }

  private toKeyBuffer(key: string | Buffer): Buffer {
    if (Buffer.isBuffer(key)) {
      return key;
    }

    // Try hex decode if it looks like hex and is 64 hex chars (32 bytes)
    if (/^[0-9a-fA-F]{64}$/.test(key)) {
      return Buffer.from(key, 'hex');
    }

    // Otherwise treat as raw UTF-8
    return Buffer.from(key, 'utf-8');
  }

  private tryBase64Decode(input: string): Buffer | null {
    try {
      if (!/^[A-Za-z0-9+/]+=*$/.test(input.replace(/\s+/g, ''))) {
        return null;
      }

      return Buffer.from(input, 'base64');
    } catch {
      return null;
    }
  }

  private tryHexDecode(input: string): Buffer | null {
    try {
      const stripped = input.replace(/\s+/g, '');

      if (stripped.length === 0 || stripped.length % 2 !== 0) {
        return null;
      }

      if (!/^[0-9a-fA-F]+$/.test(stripped)) {
        return null;
      }

      return Buffer.from(stripped, 'hex');
    } catch {
      return null;
    }
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
