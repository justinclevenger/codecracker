import type { CipherType, Solver } from './types.js';

const solvers = new Map<CipherType, Solver>();

export function registerSolver(solver: Solver): void {
  solvers.set(solver.cipherType, solver);
}

export function getSolver(cipherType: CipherType): Solver | undefined {
  return solvers.get(cipherType);
}

export function getAllSolvers(): Solver[] {
  return [...solvers.values()];
}

export function hasSolver(cipherType: CipherType): boolean {
  return solvers.has(cipherType);
}

export function getEncryptableCipherTypes(): CipherType[] {
  return [...solvers.values()]
    .filter(s => s.canEncrypt)
    .map(s => s.cipherType);
}
