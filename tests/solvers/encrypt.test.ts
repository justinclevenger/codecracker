import { describe, it, expect } from 'vitest';
import { dictionaryWordRatio } from '../../src/analysis/dictionary.js';
import { setDictionaryScorer } from '../../src/analysis/scoring.js';

// Classic solvers
import { CaesarSolver } from '../../src/solvers/classic/caesar.js';
import { Rot13Solver } from '../../src/solvers/classic/rot13.js';
import { AtbashSolver } from '../../src/solvers/classic/atbash.js';
import { VigenereSolver } from '../../src/solvers/classic/vigenere.js';
import { SubstitutionSolver } from '../../src/solvers/classic/substitution.js';
import { RailFenceSolver } from '../../src/solvers/classic/rail-fence.js';
import { PlayfairSolver } from '../../src/solvers/classic/playfair.js';
import { ColumnarTranspositionSolver } from '../../src/solvers/classic/columnar-transposition.js';

// Encoding solvers
import { Base64Solver } from '../../src/solvers/encoding/base64.js';
import { Base32Solver } from '../../src/solvers/encoding/base32.js';
import { HexSolver } from '../../src/solvers/encoding/hex.js';
import { BinarySolver } from '../../src/solvers/encoding/binary.js';
import { UrlEncodingSolver } from '../../src/solvers/encoding/url.js';
import { MorseSolver } from '../../src/solvers/encoding/morse.js';

// Modern solvers
import { XorSolver } from '../../src/solvers/modern/xor.js';
import { AesSolver } from '../../src/solvers/modern/aes.js';
import { HashLookupSolver } from '../../src/solvers/modern/hash-lookup.js';

// Initialize dictionary scorer for solvers that use scorePlaintext
setDictionaryScorer(dictionaryWordRatio);

describe('Solver encrypt()', () => {
  describe('CaesarSolver', () => {
    const solver = new CaesarSolver();

    it('has canEncrypt = true', () => {
      expect(solver.canEncrypt).toBe(true);
    });

    it('encrypts with default shift 3', async () => {
      const result = await solver.encrypt!('Hello World');
      expect(result.ciphertext).toBe('Khoor Zruog');
      expect(result.cipherType).toBe('caesar');
      expect(result.key).toBe(3);
    });

    it('encrypts with custom shift', async () => {
      const result = await solver.encrypt!('Hello', { key: '5' });
      expect(result.ciphertext).toBe('Mjqqt');
      expect(result.key).toBe(5);
    });

    it('roundtrips: encrypt then decrypt recovers original', async () => {
      const original = 'Hello World';
      const encrypted = await solver.encrypt!(original);
      const decrypted = await solver.solve(encrypted.ciphertext);
      const found = decrypted.some(r => r.plaintext === original);
      expect(found).toBe(true);
    });
  });

  describe('Rot13Solver', () => {
    const solver = new Rot13Solver();

    it('has canEncrypt = true', () => {
      expect(solver.canEncrypt).toBe(true);
    });

    it('encrypts with ROT13', async () => {
      const result = await solver.encrypt!('Hello World');
      expect(result.ciphertext).toBe('Uryyb Jbeyq');
      expect(result.cipherType).toBe('rot13');
    });

    it('roundtrips: ROT13 is self-inverse', async () => {
      const original = 'Hello World';
      const encrypted = await solver.encrypt!(original);
      const decrypted = await solver.encrypt!(encrypted.ciphertext);
      expect(decrypted.ciphertext).toBe(original);
    });
  });

  describe('AtbashSolver', () => {
    const solver = new AtbashSolver();

    it('has canEncrypt = true', () => {
      expect(solver.canEncrypt).toBe(true);
    });

    it('encrypts with Atbash', async () => {
      const result = await solver.encrypt!('Hello World');
      expect(result.ciphertext).toBe('Svool Dliow');
      expect(result.cipherType).toBe('atbash');
    });

    it('roundtrips: Atbash is self-inverse', async () => {
      const original = 'Hello World';
      const encrypted = await solver.encrypt!(original);
      const decrypted = await solver.encrypt!(encrypted.ciphertext);
      expect(decrypted.ciphertext).toBe(original);
    });
  });

  describe('VigenereSolver', () => {
    const solver = new VigenereSolver();

    it('has canEncrypt = true', () => {
      expect(solver.canEncrypt).toBe(true);
    });

    it('encrypts with key', async () => {
      const result = await solver.encrypt!('Hello World', { key: 'key' });
      expect(result.cipherType).toBe('vigenere');
      expect(result.key).toBe('key');
      expect(result.ciphertext.length).toBe('Hello World'.length);
    });

    it('throws without key', async () => {
      await expect(solver.encrypt!('Hello')).rejects.toThrow('requires a key');
    });

    it('roundtrips: encrypt then decrypt recovers original', async () => {
      const original = 'Hello World';
      const encrypted = await solver.encrypt!(original, { key: 'secret' });
      const decrypted = await solver.solve(encrypted.ciphertext, { key: 'secret' });
      expect(decrypted[0].plaintext).toBe(original);
    });
  });

  describe('SubstitutionSolver', () => {
    const solver = new SubstitutionSolver();
    const keyAlphabet = 'zyxwvutsrqponmlkjihgfedcba'; // Reverse alphabet (same as atbash)

    it('has canEncrypt = true', () => {
      expect(solver.canEncrypt).toBe(true);
    });

    it('encrypts with 26-char key', async () => {
      const result = await solver.encrypt!('abc', { key: keyAlphabet });
      expect(result.ciphertext).toBe('zyx');
      expect(result.cipherType).toBe('substitution');
    });

    it('throws without 26-char key', async () => {
      await expect(solver.encrypt!('abc', { key: 'short' })).rejects.toThrow('26-character key');
    });

    it('roundtrips with known key', async () => {
      const original = 'hello';
      const encrypted = await solver.encrypt!(original, { key: keyAlphabet });
      const decrypted = await solver.solve(encrypted.ciphertext, { key: keyAlphabet });
      expect(decrypted[0].plaintext).toBe(original);
    });
  });

  describe('RailFenceSolver', () => {
    const solver = new RailFenceSolver();

    it('has canEncrypt = true', () => {
      expect(solver.canEncrypt).toBe(true);
    });

    it('encrypts with default 3 rails', async () => {
      const result = await solver.encrypt!('WEAREDISCOVEREDRUNATONCE');
      expect(result.cipherType).toBe('rail-fence');
      expect(result.key).toBe(3);
      expect(result.ciphertext).toBe('WECRUOERDSOEERNTNEAIVDAC');
    });

    it('roundtrips: encrypt then decrypt recovers original', async () => {
      const original = 'Hello World Test';
      const encrypted = await solver.encrypt!(original, { key: '3' });
      const decrypted = await solver.solve(encrypted.ciphertext);
      const found = decrypted.some(r => r.plaintext === original);
      expect(found).toBe(true);
    });
  });

  describe('PlayfairSolver', () => {
    const solver = new PlayfairSolver();

    it('has canEncrypt = true', () => {
      expect(solver.canEncrypt).toBe(true);
    });

    it('encrypts with key', async () => {
      const result = await solver.encrypt!('hello', { key: 'monarchy' });
      expect(result.cipherType).toBe('playfair');
      expect(result.ciphertext.length).toBeGreaterThan(0);
    });

    it('throws without key', async () => {
      await expect(solver.encrypt!('hello')).rejects.toThrow('requires a key');
    });

    it('roundtrips: encrypt then decrypt recovers close to original', async () => {
      const encrypted = await solver.encrypt!('hello', { key: 'monarchy' });
      const decrypted = await solver.solve(encrypted.ciphertext, { key: 'monarchy' });
      // Playfair adds filler chars and merges I/J, so exact match isn't guaranteed
      expect(decrypted[0].plaintext.length).toBeGreaterThan(0);
    });
  });

  describe('ColumnarTranspositionSolver', () => {
    const solver = new ColumnarTranspositionSolver();

    it('has canEncrypt = true', () => {
      expect(solver.canEncrypt).toBe(true);
    });

    it('encrypts with keyword', async () => {
      const result = await solver.encrypt!('HELLOWORLD', { key: 'KEY' });
      expect(result.cipherType).toBe('columnar-transposition');
      expect(result.ciphertext.length).toBe('HELLOWORLD'.length);
    });

    it('throws without key', async () => {
      await expect(solver.encrypt!('hello')).rejects.toThrow('requires a key');
    });
  });

  describe('Base64Solver', () => {
    const solver = new Base64Solver();

    it('has canEncrypt = true', () => {
      expect(solver.canEncrypt).toBe(true);
    });

    it('encodes to base64', async () => {
      const result = await solver.encrypt!('Hello World');
      expect(result.ciphertext).toBe('SGVsbG8gV29ybGQ=');
      expect(result.cipherType).toBe('base64');
    });

    it('roundtrips: encode then decode', async () => {
      const original = 'Hello World';
      const encrypted = await solver.encrypt!(original);
      const decrypted = await solver.solve(encrypted.ciphertext);
      expect(decrypted[0].plaintext).toBe(original);
    });
  });

  describe('Base32Solver', () => {
    const solver = new Base32Solver();

    it('has canEncrypt = true', () => {
      expect(solver.canEncrypt).toBe(true);
    });

    it('encodes to base32', async () => {
      const result = await solver.encrypt!('Hello World');
      expect(result.ciphertext).toBe('JBSWY3DPEBLW64TMMQ======');
      expect(result.cipherType).toBe('base32');
    });

    it('roundtrips: encode then decode', async () => {
      const original = 'Hello World';
      const encrypted = await solver.encrypt!(original);
      const decrypted = await solver.solve(encrypted.ciphertext);
      expect(decrypted[0].plaintext).toBe(original);
    });
  });

  describe('HexSolver', () => {
    const solver = new HexSolver();

    it('has canEncrypt = true', () => {
      expect(solver.canEncrypt).toBe(true);
    });

    it('encodes to hex', async () => {
      const result = await solver.encrypt!('Hello World');
      expect(result.ciphertext).toBe('48656c6c6f20576f726c64');
      expect(result.cipherType).toBe('hex');
    });

    it('roundtrips: encode then decode', async () => {
      const original = 'Hello World';
      const encrypted = await solver.encrypt!(original);
      const decrypted = await solver.solve(encrypted.ciphertext);
      expect(decrypted[0].plaintext).toBe(original);
    });
  });

  describe('BinarySolver', () => {
    const solver = new BinarySolver();

    it('has canEncrypt = true', () => {
      expect(solver.canEncrypt).toBe(true);
    });

    it('encodes to binary', async () => {
      const result = await solver.encrypt!('Hi');
      expect(result.ciphertext).toBe('01001000 01101001');
      expect(result.cipherType).toBe('binary');
    });

    it('roundtrips: encode then decode', async () => {
      const original = 'Hi';
      const encrypted = await solver.encrypt!(original);
      const decrypted = await solver.solve(encrypted.ciphertext);
      expect(decrypted[0].plaintext).toBe(original);
    });
  });

  describe('UrlEncodingSolver', () => {
    const solver = new UrlEncodingSolver();

    it('has canEncrypt = true', () => {
      expect(solver.canEncrypt).toBe(true);
    });

    it('URL-encodes text', async () => {
      const result = await solver.encrypt!('Hello World!');
      expect(result.ciphertext).toBe('Hello%20World!');
      expect(result.cipherType).toBe('url-encoding');
    });

    it('roundtrips: encode then decode', async () => {
      const original = 'Hello World!';
      const encrypted = await solver.encrypt!(original);
      const decrypted = await solver.solve(encrypted.ciphertext);
      expect(decrypted[0].plaintext).toBe(original);
    });
  });

  describe('MorseSolver', () => {
    const solver = new MorseSolver();

    it('has canEncrypt = true', () => {
      expect(solver.canEncrypt).toBe(true);
    });

    it('encodes to morse', async () => {
      const result = await solver.encrypt!('HI');
      expect(result.ciphertext).toBe('.... ..');
      expect(result.cipherType).toBe('morse');
    });

    it('roundtrips: encode then decode', async () => {
      const original = 'HELLO WORLD';
      const encrypted = await solver.encrypt!(original);
      const decrypted = await solver.solve(encrypted.ciphertext);
      expect(decrypted[0].plaintext).toBe(original);
    });
  });

  describe('XorSolver', () => {
    const solver = new XorSolver();

    it('has canEncrypt = true', () => {
      expect(solver.canEncrypt).toBe(true);
    });

    it('encrypts with key', async () => {
      const result = await solver.encrypt!('Hello', { key: 'K' });
      expect(result.cipherType).toBe('xor');
      expect(result.ciphertext.length).toBeGreaterThan(0);
    });

    it('throws without key', async () => {
      await expect(solver.encrypt!('Hello')).rejects.toThrow('requires a key');
    });

    it('roundtrips: XOR is symmetric', async () => {
      const original = 'Hello World';
      const encrypted = await solver.encrypt!(original, { key: 'secret' });
      const decrypted = await solver.solve(encrypted.ciphertext, { key: 'secret' });
      expect(decrypted[0].plaintext).toBe(original);
    });
  });

  describe('AesSolver', () => {
    const solver = new AesSolver();
    const key32 = 'a'.repeat(32); // 32-byte key

    it('has canEncrypt = true', () => {
      expect(solver.canEncrypt).toBe(true);
    });

    it('encrypts with 32-byte key', async () => {
      const result = await solver.encrypt!('Hello World', { key: key32 });
      expect(result.cipherType).toBe('aes');
      expect(result.ciphertext.length).toBeGreaterThan(0);
    });

    it('throws without key', async () => {
      await expect(solver.encrypt!('Hello')).rejects.toThrow('requires a 32-byte key');
    });

    it('roundtrips: encrypt then decrypt recovers original', async () => {
      const original = 'Hello World';
      const encrypted = await solver.encrypt!(original, { key: key32 });
      const decrypted = await solver.solve(encrypted.ciphertext, { key: key32 });
      expect(decrypted[0].plaintext).toBe(original);
    });
  });

  describe('HashLookupSolver', () => {
    const solver = new HashLookupSolver();

    it('has canEncrypt = false', () => {
      expect(solver.canEncrypt).toBe(false);
    });

    it('does not have an encrypt method', () => {
      expect(solver.encrypt).toBeUndefined();
    });
  });
});
