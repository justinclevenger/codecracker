import type { CipherType, CrackResult, EncryptResult, Solver, SolverOptions } from '../types.js';

export abstract class BaseSolver implements Solver {
  abstract readonly cipherType: CipherType;
  readonly canEncrypt: boolean = false;
  abstract solve(ciphertext: string, options?: SolverOptions): Promise<CrackResult[]>;

  protected makeResult(
    plaintext: string,
    confidence: number,
    key?: string | number,
    details?: Record<string, unknown>,
  ): CrackResult {
    return {
      plaintext,
      cipherType: this.cipherType,
      confidence,
      ...(key !== undefined && { key }),
      ...(details && { details }),
    };
  }

  protected makeEncryptResult(
    ciphertext: string,
    key?: string | number,
    details?: Record<string, unknown>,
  ): EncryptResult {
    return {
      ciphertext,
      cipherType: this.cipherType,
      ...(key !== undefined && { key }),
      ...(details && { details }),
    };
  }
}
