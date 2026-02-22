import type { CipherType, CrackResult, Solver, SolverOptions } from '../types.js';

export abstract class BaseSolver implements Solver {
  abstract readonly cipherType: CipherType;
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
}
