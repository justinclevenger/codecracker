import { BaseSolver } from '../base-solver.js';
import type { CrackResult, EncryptOptions, EncryptResult, SolverOptions } from '../../types.js';
import { CHAR_TO_MORSE, MORSE_TO_CHAR } from '../../data/morse.js';

export class MorseSolver extends BaseSolver {
  readonly cipherType = 'morse' as const;
  override readonly canEncrypt = true;

  async solve(ciphertext: string, _options?: SolverOptions): Promise<CrackResult[]> {
    const input = ciphertext.trim();

    if (!this.isMorse(input)) {
      return [];
    }

    try {
      const decoded = this.decodeMorse(input);

      if (decoded.length === 0) {
        return [];
      }

      const printableRatio = this.getPrintableRatio(decoded);

      if (printableRatio < 0.8) {
        return [];
      }

      const confidence = Math.min(printableRatio, 1);

      return [this.makeResult(decoded, confidence, undefined, { encoding: 'morse' })];
    } catch {
      return [];
    }
  }

  async encrypt(plaintext: string, _options?: EncryptOptions): Promise<EncryptResult> {
    const words = plaintext.toUpperCase().split(' ');
    const morseWords: string[] = [];
    for (const word of words) {
      const morseLetters: string[] = [];
      for (const ch of word) {
        const morse = CHAR_TO_MORSE[ch];
        if (morse !== undefined && morse !== '/') {
          morseLetters.push(morse);
        }
      }
      if (morseLetters.length > 0) {
        morseWords.push(morseLetters.join(' '));
      }
    }
    const ciphertext = morseWords.join(' / ');
    return this.makeEncryptResult(ciphertext, undefined, { encoding: 'morse' });
  }

  private isMorse(input: string): boolean {
    if (input.length === 0) {
      return false;
    }

    // Morse code only contains dots (.), dashes (-), spaces, and / (word separator)
    return /^[.\-\s/]+$/.test(input);
  }

  private decodeMorse(input: string): string {
    // Split by ' / ' for words
    const words = input.split(' / ');

    const decodedWords: string[] = [];

    for (const word of words) {
      // Split by space for individual letters
      const letters = word.trim().split(/\s+/);
      let decodedWord = '';

      for (const letter of letters) {
        if (letter.length === 0) {
          continue;
        }

        const char = MORSE_TO_CHAR[letter];
        if (char !== undefined) {
          decodedWord += char;
        } else {
          // Unknown morse sequence - skip it
          return '';
        }
      }

      decodedWords.push(decodedWord);
    }

    return decodedWords.join(' ');
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
