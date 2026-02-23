import { BaseSolver } from '../base-solver.js';
import type { CrackResult, EncryptOptions, EncryptResult, SolverOptions } from '../../types.js';
import { privateDecrypt, publicEncrypt, constants } from 'node:crypto';

export class RsaSolver extends BaseSolver {
  readonly cipherType = 'rsa' as const;
  override readonly canEncrypt = true;

  async encrypt(plaintext: string, options?: EncryptOptions): Promise<EncryptResult> {
    if (!options?.key) {
      throw new Error("Cipher 'rsa' requires a public key for encryption");
    }
    const publicKey = Buffer.isBuffer(options.key) ? options.key.toString('utf-8') : options.key;
    const encrypted = publicEncrypt(
      {
        key: publicKey,
        padding: constants.RSA_PKCS1_OAEP_PADDING,
      },
      Buffer.from(plaintext, 'utf-8'),
    );
    const ciphertext = encrypted.toString('base64');
    return this.makeEncryptResult(ciphertext, undefined, {
      algorithm: 'RSA',
      padding: 'PKCS1_OAEP',
    });
  }

  async solve(ciphertext: string, options?: SolverOptions): Promise<CrackResult[]> {
    if (!options?.key) {
      return [];
    }

    const input = ciphertext.trim();

    if (input.length === 0) {
      return [];
    }

    try {
      const encryptedData = Buffer.from(input, 'base64');

      if (encryptedData.length === 0) {
        return [];
      }

      const privateKey = Buffer.isBuffer(options.key)
        ? options.key.toString('utf-8')
        : options.key;

      const decrypted = privateDecrypt(
        {
          key: privateKey,
          padding: constants.RSA_PKCS1_OAEP_PADDING,
        },
        encryptedData,
      );

      const plaintext = decrypted.toString('utf-8');

      if (plaintext.length === 0) {
        return [];
      }

      return [this.makeResult(plaintext, 0.95, undefined, {
        algorithm: 'RSA',
        padding: 'PKCS1_OAEP',
      })];
    } catch {
      return [];
    }
  }
}
