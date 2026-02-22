import { describe, it, expect } from 'vitest';
import { crack, decrypt, detect, registerSolver, BaseSolver } from '../../src/index.js';
import type { CrackResult, SolverOptions } from '../../src/types.js';

describe('crack() integration', () => {
  it('cracks ROT13 encoded text', async () => {
    const result = await crack('Uryyb Jbeyq');
    const rot13 = result.results.find(r => r.cipherType === 'rot13');
    expect(rot13).toBeDefined();
    expect(rot13!.plaintext).toBe('Hello World');
  });

  it('cracks Caesar cipher', async () => {
    // "Hello World" shifted by 3 = "Khoor Zruog"
    const result = await crack('Khoor Zruog');
    const topResults = result.results.slice(0, 5);
    const found = topResults.some(r => r.plaintext === 'Hello World');
    expect(found).toBe(true);
  });

  it('cracks Base64 encoding', async () => {
    const result = await crack('SGVsbG8gV29ybGQ=');
    const b64 = result.results.find(r => r.cipherType === 'base64');
    expect(b64).toBeDefined();
    expect(b64!.plaintext).toBe('Hello World');
  });

  it('cracks hex encoding', async () => {
    const result = await crack('48656c6c6f');
    const hex = result.results.find(r => r.cipherType === 'hex');
    expect(hex).toBeDefined();
    expect(hex!.plaintext).toBe('Hello');
  });

  it('cracks morse code', async () => {
    const result = await crack('.... . .-.. .-.. ---');
    const morse = result.results.find(r => r.cipherType === 'morse');
    expect(morse).toBeDefined();
    expect(morse!.plaintext).toBe('HELLO');
  });

  it('cracks binary encoding', async () => {
    const result = await crack('01001000 01101001');
    const binary = result.results.find(r => r.cipherType === 'binary');
    expect(binary).toBeDefined();
    expect(binary!.plaintext).toBe('Hi');
  });

  it('cracks URL encoding', async () => {
    const result = await crack('Hello%20World');
    const url = result.results.find(r => r.cipherType === 'url-encoding');
    expect(url).toBeDefined();
    expect(url!.plaintext).toBe('Hello World');
  });

  it('cracks Atbash cipher', async () => {
    // Atbash of "Hello" = "Svool"
    const result = await crack('Svool Dliow');
    const atbash = result.results.find(r => r.cipherType === 'atbash');
    expect(atbash).toBeDefined();
    expect(atbash!.plaintext).toBe('Hello World');
  });

  it('returns warnings for short input', async () => {
    const result = await crack('Hi');
    expect(result.warnings.some(w => w.includes('Short input'))).toBe(true);
  });

  it('returns empty results for empty input', async () => {
    const result = await crack('');
    expect(result.results).toEqual([]);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('returns results sorted by confidence', async () => {
    const result = await crack('Uryyb Jbeyq');
    for (let i = 1; i < result.results.length; i++) {
      expect(result.results[i].confidence).toBeLessThanOrEqual(result.results[i - 1].confidence);
    }
  });

  it('results include confidence scores between 0 and 1', async () => {
    const result = await crack('SGVsbG8gV29ybGQ=');
    for (const r of result.results) {
      expect(r.confidence).toBeGreaterThanOrEqual(0);
      expect(r.confidence).toBeLessThanOrEqual(1);
    }
  });
});

describe('decrypt() with known cipher type', () => {
  it('decrypts Caesar with known type', async () => {
    const results = await decrypt('Khoor Zruog', 'caesar');
    expect(results.length).toBeGreaterThan(0);
    const found = results.some(r => r.plaintext === 'Hello World');
    expect(found).toBe(true);
  });

  it('decrypts Vigenere with known key', async () => {
    // "HELLO" encrypted with key "KEY" = "RIJVS"
    const results = await decrypt('RIJVS', 'vigenere', { key: 'key' });
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].plaintext).toBe('HELLO');
  });

  it('throws for unknown cipher type', async () => {
    await expect(decrypt('test', 'unknown' as any)).rejects.toThrow();
  });
});

describe('detect()', () => {
  it('detects base64 patterns', () => {
    const candidates = detect('SGVsbG8gV29ybGQ=');
    expect(candidates.some(c => c.cipherType === 'base64')).toBe(true);
  });

  it('detects morse code', () => {
    const candidates = detect('.... . .-.. .-.. ---');
    expect(candidates.some(c => c.cipherType === 'morse')).toBe(true);
  });
});

describe('registerSolver()', () => {
  it('allows registering custom solvers', async () => {
    class CustomSolver extends BaseSolver {
      readonly cipherType = 'rot13' as const; // override rot13 for test

      async solve(ciphertext: string): Promise<CrackResult[]> {
        return [this.makeResult('custom: ' + ciphertext, 0.99)];
      }
    }

    registerSolver(new CustomSolver());
    const results = await decrypt('test', 'rot13');
    expect(results[0].plaintext).toBe('custom: test');

    // Restore original solver by re-importing
    const { Rot13Solver } = await import('../../src/solvers/classic/rot13.js');
    registerSolver(new Rot13Solver());
  });
});
