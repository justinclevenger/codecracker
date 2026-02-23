import type { CipherType, CrackResponse, CrackResult, EncryptOptions, EncryptResult, SolverOptions } from './types.js';
import { detect } from './detection/detector.js';
import { getSolver, getAllSolvers, hasSolver } from './registry.js';
import { scorePlaintext, finalConfidence } from './analysis/scoring.js';

export interface CrackOptions extends SolverOptions {
  /** Maximum number of results to return */
  maxResults?: number;
  /** Maximum recursion depth for layered encodings */
  maxDepth?: number;
  /** Minimum confidence threshold */
  minConfidence?: number;
}

/**
 * Auto-detect cipher type and attempt decryption.
 */
export async function crack(ciphertext: string, options: CrackOptions = {}): Promise<CrackResponse> {
  const { maxResults = 10, maxDepth = 3, minConfidence = 0.01, ...solverOptions } = options;
  const warnings: string[] = [];

  if (!ciphertext || ciphertext.trim().length === 0) {
    return { results: [], warnings: ['Empty ciphertext provided'] };
  }

  if (ciphertext.length < 20) {
    warnings.push('Short input (< 20 chars) may produce unreliable results');
  }

  // Detect cipher types
  const candidates = detect(ciphertext);

  if (candidates.length === 0) {
    return { results: [], warnings: [...warnings, 'No cipher type detected'] };
  }

  // Try each candidate solver
  const allResults: CrackResult[] = [];

  for (const candidate of candidates) {
    const solver = getSolver(candidate.cipherType);
    if (!solver) continue;

    try {
      const results = await solver.solve(ciphertext, solverOptions);
      for (const result of results) {
        // Recalculate confidence using composite scoring
        const quality = scorePlaintext(result.plaintext);
        result.confidence = finalConfidence(candidate.confidence, quality.total);
        result.details = { ...result.details, qualityScore: quality };
        allResults.push(result);
      }
    } catch {
      // Solver failed, skip
    }
  }

  // Sort by confidence, deduplicate, and limit
  const seen = new Set<string>();
  const dedupedResults = allResults
    .sort((a, b) => b.confidence - a.confidence)
    .filter(r => {
      if (r.confidence < minConfidence) return false;
      const key = r.plaintext.trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  // Try recursive decoding on top results
  let results = dedupedResults.slice(0, maxResults);
  if (maxDepth > 1) {
    results = await tryRecursiveDecode(results, { ...options, maxDepth: maxDepth - 1, maxResults });
  }

  return { results: results.slice(0, maxResults), warnings };
}

/**
 * Decrypt with a specific known cipher type.
 */
export async function decrypt(
  ciphertext: string,
  cipherType: CipherType,
  options: SolverOptions = {},
): Promise<CrackResult[]> {
  const solver = getSolver(cipherType);
  if (!solver) {
    throw new Error(`No solver registered for cipher type: ${cipherType}`);
  }

  const results = await solver.solve(ciphertext, options);

  // Score results
  for (const result of results) {
    const quality = scorePlaintext(result.plaintext);
    result.confidence = quality.total;
    result.details = { ...result.details, qualityScore: quality };
  }

  return results.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Encrypt plaintext with a specific cipher type.
 */
export async function encrypt(
  plaintext: string,
  cipherType: CipherType,
  options: EncryptOptions = {},
): Promise<EncryptResult> {
  if (!plaintext || plaintext.length === 0) {
    throw new Error('Empty plaintext provided');
  }

  const solver = getSolver(cipherType);
  if (!solver) {
    throw new Error(`No solver registered for cipher type: ${cipherType}`);
  }

  if (!solver.canEncrypt || !solver.encrypt) {
    throw new Error(`Cipher '${cipherType}' does not support encryption`);
  }

  return solver.encrypt(plaintext, options);
}

/**
 * Try to recursively decode top results (e.g., Base64 wrapping Caesar).
 */
async function tryRecursiveDecode(
  results: CrackResult[],
  options: CrackOptions,
): Promise<CrackResult[]> {
  const enhanced: CrackResult[] = [...results];

  // Only try recursive decoding on top 3 results
  for (const result of results.slice(0, 3)) {
    // Skip if already high confidence or plaintext is short
    if (result.confidence > 0.8 || result.plaintext.length < 4) continue;

    try {
      const innerResponse = await crack(result.plaintext, {
        ...options,
        maxResults: 3,
      });

      for (const inner of innerResponse.results) {
        if (inner.confidence > result.confidence) {
          enhanced.push({
            ...inner,
            details: {
              ...inner.details,
              layers: [
                { cipherType: result.cipherType, key: result.key },
                { cipherType: inner.cipherType, key: inner.key },
              ],
            },
          });
        }
      }
    } catch {
      // Recursive decode failed, skip
    }
  }

  return enhanced.sort((a, b) => b.confidence - a.confidence);
}
