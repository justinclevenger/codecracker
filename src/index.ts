// Initialize analysis modules
import { dictionaryWordRatio } from './analysis/dictionary.js';
import { setDictionaryScorer } from './analysis/scoring.js';
setDictionaryScorer(dictionaryWordRatio);

// Register all built-in solvers
import { registerSolver } from './registry.js';

import { CaesarSolver } from './solvers/classic/caesar.js';
import { Rot13Solver } from './solvers/classic/rot13.js';
import { AtbashSolver } from './solvers/classic/atbash.js';
import { VigenereSolver } from './solvers/classic/vigenere.js';
import { SubstitutionSolver } from './solvers/classic/substitution.js';
import { RailFenceSolver } from './solvers/classic/rail-fence.js';
import { PlayfairSolver } from './solvers/classic/playfair.js';
import { ColumnarTranspositionSolver } from './solvers/classic/columnar-transposition.js';

import { Base64Solver } from './solvers/encoding/base64.js';
import { Base32Solver } from './solvers/encoding/base32.js';
import { HexSolver } from './solvers/encoding/hex.js';
import { BinarySolver } from './solvers/encoding/binary.js';
import { UrlEncodingSolver } from './solvers/encoding/url.js';
import { MorseSolver } from './solvers/encoding/morse.js';

import { XorSolver } from './solvers/modern/xor.js';
import { HashLookupSolver } from './solvers/modern/hash-lookup.js';
import { AesSolver } from './solvers/modern/aes.js';
import { RsaSolver } from './solvers/modern/rsa.js';

const builtinSolvers = [
  new CaesarSolver(),
  new Rot13Solver(),
  new AtbashSolver(),
  new VigenereSolver(),
  new SubstitutionSolver(),
  new RailFenceSolver(),
  new PlayfairSolver(),
  new ColumnarTranspositionSolver(),
  new Base64Solver(),
  new Base32Solver(),
  new HexSolver(),
  new BinarySolver(),
  new UrlEncodingSolver(),
  new MorseSolver(),
  new XorSolver(),
  new HashLookupSolver(),
  new AesSolver(),
  new RsaSolver(),
];

for (const solver of builtinSolvers) {
  registerSolver(solver);
}

// Public API
export { crack, decrypt, encrypt } from './cracker.js';
export type { CrackOptions } from './cracker.js';
export { detect } from './detection/detector.js';
export { registerSolver, getEncryptableCipherTypes } from './registry.js';

// Re-export types
export type {
  CipherType,
  CrackResult,
  CrackResponse,
  DetectionCandidate,
  EncryptResult,
  EncryptOptions,
  Solver,
  SolverOptions,
  PlaintextScore,
} from './types.js';

// Export base solver for plugin authors
export { BaseSolver } from './solvers/base-solver.js';
