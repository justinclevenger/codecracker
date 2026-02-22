import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import { dictionaryWordRatio } from '../../src/analysis/dictionary.js';
import { setDictionaryScorer } from '../../src/analysis/scoring.js';
import { XorSolver } from '../../src/solvers/modern/xor.js';
import { HashLookupSolver } from '../../src/solvers/modern/hash-lookup.js';
import { AesSolver } from '../../src/solvers/modern/aes.js';
import { RsaSolver } from '../../src/solvers/modern/rsa.js';

// Initialize the dictionary scorer before any solver that uses scorePlaintext
setDictionaryScorer(dictionaryWordRatio);

describe('XorSolver', () => {
  const solver = new XorSolver();

  it('decrypts XOR with a known single-byte key via hex input', async () => {
    // XOR "Hello" with byte 0x42
    const plaintext = 'Hello';
    const keyByte = 0x42;
    const plaintextBytes = Buffer.from(plaintext, 'utf-8');
    const xored = Buffer.alloc(plaintextBytes.length);
    for (let i = 0; i < plaintextBytes.length; i++) {
      xored[i] = plaintextBytes[i]! ^ keyByte;
    }
    const hexCiphertext = xored.toString('hex');

    // Use the known key (as a Buffer with the single byte)
    const results = await solver.solve(hexCiphertext, { key: Buffer.from([keyByte]) });

    expect(results).toHaveLength(1);
    expect(results[0].plaintext).toBe('Hello');
    expect(results[0].cipherType).toBe('xor');
  });

  it('brute-forces single-byte XOR on English text', async () => {
    // XOR an English sentence with a single byte
    const plaintext = 'The quick brown fox jumps over the lazy dog';
    const keyByte = 0x5A;
    const plaintextBytes = Buffer.from(plaintext, 'utf-8');
    const xored = Buffer.alloc(plaintextBytes.length);
    for (let i = 0; i < plaintextBytes.length; i++) {
      xored[i] = plaintextBytes[i]! ^ keyByte;
    }
    const hexCiphertext = xored.toString('hex');

    const results = await solver.solve(hexCiphertext);

    expect(results.length).toBeGreaterThan(0);

    // The correct plaintext should be among the top results
    const plaintexts = results.map(r => r.plaintext);
    expect(plaintexts).toContain(plaintext);
  });

  it('returns the correct key byte in brute-force results', async () => {
    const plaintext = 'The quick brown fox jumps over the lazy dog';
    const keyByte = 0x5A;
    const plaintextBytes = Buffer.from(plaintext, 'utf-8');
    const xored = Buffer.alloc(plaintextBytes.length);
    for (let i = 0; i < plaintextBytes.length; i++) {
      xored[i] = plaintextBytes[i]! ^ keyByte;
    }
    const hexCiphertext = xored.toString('hex');

    const results = await solver.solve(hexCiphertext);

    // Find the result that matches our plaintext and check the key
    const match = results.find(r => r.plaintext === plaintext);
    expect(match).toBeDefined();
    expect(match!.key).toBe('0x5a');
  });

  it('decrypts XOR with a multi-byte string key', async () => {
    const plaintext = 'Hello World';
    const key = 'mykey';
    const plaintextBytes = Buffer.from(plaintext, 'utf-8');
    const keyBytes = Buffer.from(key, 'utf-8');
    const xored = Buffer.alloc(plaintextBytes.length);
    for (let i = 0; i < plaintextBytes.length; i++) {
      xored[i] = plaintextBytes[i]! ^ keyBytes[i % keyBytes.length]!;
    }
    const hexCiphertext = xored.toString('hex');

    const results = await solver.solve(hexCiphertext, { key });

    expect(results).toHaveLength(1);
    expect(results[0].plaintext).toBe('Hello World');
  });

  it('returns empty array for empty input', async () => {
    const results = await solver.solve('');
    expect(results).toEqual([]);
  });

  it('returns empty array for whitespace-only input', async () => {
    const results = await solver.solve('   ');
    expect(results).toEqual([]);
  });
});

describe('HashLookupSolver', () => {
  const solver = new HashLookupSolver();

  it('finds "password" from its MD5 hash', async () => {
    const md5Hash = createHash('md5').update('password').digest('hex');
    const results = await solver.solve(md5Hash);

    expect(results).toHaveLength(1);
    expect(results[0].plaintext).toBe('password');
    expect(results[0].cipherType).toBe('hash-lookup');
    expect(results[0].confidence).toBe(0.99);
    expect(results[0].details?.hashType).toBe('MD5');
  });

  it('finds "password" from its SHA1 hash', async () => {
    const sha1Hash = createHash('sha1').update('password').digest('hex');
    const results = await solver.solve(sha1Hash);

    expect(results).toHaveLength(1);
    expect(results[0].plaintext).toBe('password');
    expect(results[0].details?.hashType).toBe('SHA1');
  });

  it('finds "password" from its SHA256 hash', async () => {
    const sha256Hash = createHash('sha256').update('password').digest('hex');
    const results = await solver.solve(sha256Hash);

    expect(results).toHaveLength(1);
    expect(results[0].plaintext).toBe('password');
    expect(results[0].details?.hashType).toBe('SHA256');
  });

  it('finds common passwords like "123456"', async () => {
    const md5Hash = createHash('md5').update('123456').digest('hex');
    const results = await solver.solve(md5Hash);

    expect(results).toHaveLength(1);
    expect(results[0].plaintext).toBe('123456');
  });

  it('returns empty array for an unknown hash', async () => {
    // Hash of a string not in the common passwords list
    const md5Hash = createHash('md5').update('xK9$mP2!vQ7@nR4#').digest('hex');
    const results = await solver.solve(md5Hash);

    expect(results).toEqual([]);
  });

  it('returns empty array for non-hex input', async () => {
    const results = await solver.solve('not-a-hash-value');
    expect(results).toEqual([]);
  });

  it('returns empty array for hex string of unsupported length', async () => {
    // 16 hex chars (8 bytes) is not MD5 (32), SHA1 (40), or SHA256 (64)
    const results = await solver.solve('abcdef0123456789');
    expect(results).toEqual([]);
  });

  it('returns empty array for empty input', async () => {
    const results = await solver.solve('');
    expect(results).toEqual([]);
  });
});

describe('AesSolver', () => {
  const solver = new AesSolver();

  it('returns empty array when no key is provided', async () => {
    const results = await solver.solve('someencrypteddata');
    expect(results).toEqual([]);
  });

  it('returns empty array for empty ciphertext with key', async () => {
    const results = await solver.solve('', {
      key: '0'.repeat(64), // 32-byte key in hex
    });
    expect(results).toEqual([]);
  });

  it('returns empty array for invalid key length', async () => {
    const results = await solver.solve('deadbeef', {
      key: 'shortkey', // Not 32 bytes
    });
    expect(results).toEqual([]);
  });

  it('has correct cipher type', () => {
    expect(solver.cipherType).toBe('aes');
  });
});

describe('RsaSolver', () => {
  const solver = new RsaSolver();

  it('returns empty array when no key is provided', async () => {
    const results = await solver.solve('someencrypteddata');
    expect(results).toEqual([]);
  });

  it('returns empty array for empty ciphertext with key', async () => {
    const results = await solver.solve('', {
      key: 'some-private-key',
    });
    expect(results).toEqual([]);
  });

  it('returns empty array for invalid private key', async () => {
    const results = await solver.solve('dGVzdA==', {
      key: 'not-a-valid-private-key',
    });
    expect(results).toEqual([]);
  });

  it('has correct cipher type', () => {
    expect(solver.cipherType).toBe('rsa');
  });
});
