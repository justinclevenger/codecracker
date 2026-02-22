import { describe, it, expect } from 'vitest';
import { Base64Solver } from '../../src/solvers/encoding/base64.js';
import { HexSolver } from '../../src/solvers/encoding/hex.js';
import { BinarySolver } from '../../src/solvers/encoding/binary.js';
import { UrlEncodingSolver } from '../../src/solvers/encoding/url.js';
import { MorseSolver } from '../../src/solvers/encoding/morse.js';
import { Base32Solver } from '../../src/solvers/encoding/base32.js';

describe('Base64Solver', () => {
  const solver = new Base64Solver();

  it('decodes a valid base64 string', async () => {
    const encoded = Buffer.from('Hello World').toString('base64'); // "SGVsbG8gV29ybGQ="
    const results = await solver.solve(encoded);

    expect(results).toHaveLength(1);
    expect(results[0].plaintext).toBe('Hello World');
    expect(results[0].cipherType).toBe('base64');
    expect(results[0].confidence).toBeGreaterThan(0);
  });

  it('returns empty array for invalid base64 input', async () => {
    const results = await solver.solve('!!!not-base64###');
    expect(results).toEqual([]);
  });

  it('returns empty array for empty input', async () => {
    const results = await solver.solve('');
    expect(results).toEqual([]);
  });

  it('returns empty array for base64 string with wrong length', async () => {
    // Not a multiple of 4
    const results = await solver.solve('SGVsb');
    expect(results).toEqual([]);
  });
});

describe('HexSolver', () => {
  const solver = new HexSolver();

  it('decodes a valid hex string', async () => {
    const encoded = Buffer.from('Hello').toString('hex'); // "48656c6c6f"
    const results = await solver.solve(encoded);

    expect(results).toHaveLength(1);
    expect(results[0].plaintext).toBe('Hello');
    expect(results[0].cipherType).toBe('hex');
    expect(results[0].confidence).toBeGreaterThan(0);
  });

  it('handles hex with spaces between bytes', async () => {
    const results = await solver.solve('48 65 6c 6c 6f');
    expect(results).toHaveLength(1);
    expect(results[0].plaintext).toBe('Hello');
  });

  it('returns empty array for odd-length hex string', async () => {
    const results = await solver.solve('48656c6c6');
    expect(results).toEqual([]);
  });

  it('returns empty array for non-hex characters', async () => {
    const results = await solver.solve('ZZZZZZ');
    expect(results).toEqual([]);
  });

  it('returns empty array for empty input', async () => {
    const results = await solver.solve('');
    expect(results).toEqual([]);
  });
});

describe('BinarySolver', () => {
  const solver = new BinarySolver();

  it('decodes a valid binary string', async () => {
    // "Hi" in binary: H=01001000, i=01101001
    const results = await solver.solve('01001000 01101001');

    expect(results).toHaveLength(1);
    expect(results[0].plaintext).toBe('Hi');
    expect(results[0].cipherType).toBe('binary');
    expect(results[0].confidence).toBeGreaterThan(0);
  });

  it('decodes binary without spaces', async () => {
    // "Hi" without spaces
    const results = await solver.solve('0100100001101001');

    expect(results).toHaveLength(1);
    expect(results[0].plaintext).toBe('Hi');
  });

  it('returns empty array for non-binary input', async () => {
    const results = await solver.solve('hello world');
    expect(results).toEqual([]);
  });

  it('returns empty array for binary string not divisible by 8', async () => {
    const results = await solver.solve('0100100');
    expect(results).toEqual([]);
  });

  it('returns empty array for empty input', async () => {
    const results = await solver.solve('');
    expect(results).toEqual([]);
  });
});

describe('UrlEncodingSolver', () => {
  const solver = new UrlEncodingSolver();

  it('decodes a percent-encoded string', async () => {
    const results = await solver.solve('%48%65%6C%6C%6F%20%57%6F%72%6C%64');

    expect(results).toHaveLength(1);
    expect(results[0].plaintext).toBe('Hello World');
    expect(results[0].cipherType).toBe('url-encoding');
    expect(results[0].confidence).toBeGreaterThan(0);
  });

  it('decodes mixed encoded and plain text', async () => {
    const results = await solver.solve('Hello%20World');

    expect(results).toHaveLength(1);
    expect(results[0].plaintext).toBe('Hello World');
  });

  it('returns empty array when nothing is encoded', async () => {
    const results = await solver.solve('Hello World');
    expect(results).toEqual([]);
  });

  it('returns empty array for empty input', async () => {
    const results = await solver.solve('');
    expect(results).toEqual([]);
  });
});

describe('MorseSolver', () => {
  const solver = new MorseSolver();

  it('decodes morse code to text', async () => {
    // "HELLO" in morse: H=...., E=., L=.-.., L=.-.., O=---
    const results = await solver.solve('.... . .-.. .-.. ---');

    expect(results).toHaveLength(1);
    expect(results[0].plaintext).toBe('HELLO');
    expect(results[0].cipherType).toBe('morse');
    expect(results[0].confidence).toBeGreaterThan(0);
  });

  it('decodes morse code with word separators', async () => {
    // "HELLO WORLD" in morse with / as word separator
    const results = await solver.solve('.... . .-.. .-.. --- / .-- --- .-. .-.. -..');

    expect(results).toHaveLength(1);
    expect(results[0].plaintext).toBe('HELLO WORLD');
  });

  it('returns empty array for non-morse input', async () => {
    const results = await solver.solve('Hello World');
    expect(results).toEqual([]);
  });

  it('returns empty array for empty input', async () => {
    const results = await solver.solve('');
    expect(results).toEqual([]);
  });
});

describe('Base32Solver', () => {
  const solver = new Base32Solver();

  it('decodes a valid base32 string', async () => {
    // "Hello World" in base32 = JBSWY3DPEBLW64TMMQ======
    const results = await solver.solve('JBSWY3DPEBLW64TMMQ======');

    expect(results).toHaveLength(1);
    expect(results[0].plaintext).toBe('Hello World');
    expect(results[0].cipherType).toBe('base32');
    expect(results[0].confidence).toBeGreaterThan(0);
  });

  it('handles lowercase input (auto-uppercased)', async () => {
    const results = await solver.solve('jbswy3dpeblw64tmmq======');

    expect(results).toHaveLength(1);
    expect(results[0].plaintext).toBe('Hello World');
  });

  it('returns empty array for invalid base32 input', async () => {
    const results = await solver.solve('!!!invalid!!!');
    expect(results).toEqual([]);
  });

  it('returns empty array for base32 string with wrong padding length', async () => {
    // Not a multiple of 8
    const results = await solver.solve('JBSWY3');
    expect(results).toEqual([]);
  });

  it('returns empty array for empty input', async () => {
    const results = await solver.solve('');
    expect(results).toEqual([]);
  });
});
