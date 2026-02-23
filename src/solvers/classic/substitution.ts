import { BaseSolver } from '../base-solver.js';
import type { CrackResult, EncryptOptions, EncryptResult, SolverOptions } from '../../types.js';
import { scorePlaintext } from '../../analysis/scoring.js';
import { letterCounts } from '../../utils/text.js';

// English letters sorted by frequency (most common first)
const ENGLISH_FREQ_ORDER = 'etaoinshrdlcumwfgypbvkjxqz';

export class SubstitutionSolver extends BaseSolver {
  readonly cipherType = 'substitution' as const;
  override readonly canEncrypt = true;

  async solve(ciphertext: string, options?: SolverOptions): Promise<CrackResult[]> {
    try {
      if (options?.key && typeof options.key === 'string' && options.key.length === 26) {
        // Use provided substitution alphabet to decrypt
        const plaintext = this.decryptWithAlphabet(ciphertext, options.key.toLowerCase());
        const score = scorePlaintext(plaintext).total;
        return [this.makeResult(plaintext, score, options.key, { method: 'substitution' })];
      }

      // No key: use frequency analysis to create an initial mapping
      const mapping = this.frequencyAnalysisMapping(ciphertext);
      const plaintext = this.decryptWithMapping(ciphertext, mapping);
      const score = scorePlaintext(plaintext).total;

      // Convert mapping to a 26-letter key string
      const keyAlphabet = this.mappingToAlphabet(mapping);

      return [this.makeResult(plaintext, score, keyAlphabet, {
        method: 'frequency-analysis',
        note: 'Initial frequency-based mapping; may need refinement',
      })];
    } catch {
      return [];
    }
  }

  async encrypt(plaintext: string, options?: EncryptOptions): Promise<EncryptResult> {
    if (!options?.key || typeof options.key !== 'string' || options.key.length !== 26) {
      throw new Error("Cipher 'substitution' requires a 26-character key for encryption");
    }
    const keyAlphabet = options.key.toLowerCase();
    // Forward map: plaintext 'a'+i -> ciphertext keyAlphabet[i]
    let result = '';
    for (const ch of plaintext) {
      const code = ch.toLowerCase().charCodeAt(0);
      if (code >= 97 && code <= 122) {
        const mapped = keyAlphabet[code - 97];
        result += ch === ch.toUpperCase() ? mapped.toUpperCase() : mapped;
      } else {
        result += ch;
      }
    }
    return this.makeEncryptResult(result, options.key, { method: 'substitution' });
  }

  /**
   * Decrypt using a 26-letter substitution alphabet.
   * The key alphabet maps: key[0] decrypts to 'a', key[1] to 'b', etc.
   * So ciphertext letter key[i] -> plaintext letter (a + i).
   */
  private decryptWithAlphabet(text: string, keyAlphabet: string): string {
    // Build reverse mapping: for each ciphertext letter, find what plaintext letter it maps to
    const reverseMap = new Map<string, string>();
    for (let i = 0; i < 26; i++) {
      reverseMap.set(keyAlphabet[i], String.fromCharCode(97 + i));
    }

    let result = '';
    for (const ch of text) {
      const lower = ch.toLowerCase();
      if (reverseMap.has(lower)) {
        const mapped = reverseMap.get(lower)!;
        // Preserve case
        result += ch === ch.toUpperCase() ? mapped.toUpperCase() : mapped;
      } else {
        result += ch;
      }
    }
    return result;
  }

  /**
   * Build a frequency-based mapping from ciphertext to English.
   * Sort ciphertext letters by frequency, map to English frequency order.
   */
  private frequencyAnalysisMapping(ciphertext: string): Map<string, string> {
    const counts = letterCounts(ciphertext);

    // Create array of [letter, count] and sort by count descending
    const cipherFreq: [string, number][] = [];
    for (let i = 0; i < 26; i++) {
      cipherFreq.push([String.fromCharCode(97 + i), counts[i]]);
    }
    cipherFreq.sort((a, b) => b[1] - a[1]);

    // Map most frequent cipher letter -> most frequent English letter, etc.
    const mapping = new Map<string, string>();
    for (let i = 0; i < 26; i++) {
      mapping.set(cipherFreq[i][0], ENGLISH_FREQ_ORDER[i]);
    }

    return mapping;
  }

  /**
   * Decrypt using a letter-to-letter mapping.
   */
  private decryptWithMapping(text: string, mapping: Map<string, string>): string {
    let result = '';
    for (const ch of text) {
      const lower = ch.toLowerCase();
      if (mapping.has(lower)) {
        const mapped = mapping.get(lower)!;
        // Preserve case
        result += ch === ch.toUpperCase() ? mapped.toUpperCase() : mapped;
      } else {
        result += ch;
      }
    }
    return result;
  }

  /**
   * Convert a mapping (cipherLetter -> plainLetter) to a 26-letter key alphabet.
   * The key alphabet is: for each plaintext letter (a-z), what ciphertext letter maps to it.
   */
  private mappingToAlphabet(mapping: Map<string, string>): string {
    // Reverse: plainLetter -> cipherLetter
    const reverse = new Map<string, string>();
    for (const [cipher, plain] of mapping) {
      reverse.set(plain, cipher);
    }

    let alphabet = '';
    for (let i = 0; i < 26; i++) {
      const plain = String.fromCharCode(97 + i);
      alphabet += reverse.get(plain) ?? '?';
    }
    return alphabet;
  }
}
