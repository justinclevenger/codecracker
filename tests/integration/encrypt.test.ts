import { describe, it, expect } from 'vitest';
import { encrypt, crack, getEncryptableCipherTypes } from '../../src/index.js';
import type { CipherType } from '../../src/types.js';

describe('encrypt() API', () => {
  it('encrypts with Caesar cipher', async () => {
    const result = await encrypt('Hello World', 'caesar');
    expect(result.ciphertext).toBe('Khoor Zruog');
    expect(result.cipherType).toBe('caesar');
    expect(result.key).toBe(3);
  });

  it('encrypts with ROT13', async () => {
    const result = await encrypt('Hello World', 'rot13');
    expect(result.ciphertext).toBe('Uryyb Jbeyq');
  });

  it('encrypts with Base64', async () => {
    const result = await encrypt('Hello World', 'base64');
    expect(result.ciphertext).toBe('SGVsbG8gV29ybGQ=');
  });

  it('encrypts with Hex', async () => {
    const result = await encrypt('Hello World', 'hex');
    expect(result.ciphertext).toBe('48656c6c6f20576f726c64');
  });

  it('encrypts with Morse', async () => {
    const result = await encrypt('HI', 'morse');
    expect(result.ciphertext).toBe('.... ..');
  });

  it('throws on empty plaintext', async () => {
    await expect(encrypt('', 'caesar')).rejects.toThrow('Empty plaintext');
  });

  it('throws on hash-lookup (unsupported encryption)', async () => {
    await expect(encrypt('test', 'hash-lookup')).rejects.toThrow('does not support encryption');
  });

  it('throws on unknown cipher type', async () => {
    await expect(encrypt('test', 'unknown' as CipherType)).rejects.toThrow('No solver registered');
  });

  it('encrypt-then-crack roundtrip for Caesar', async () => {
    const original = 'Hello World';
    const encrypted = await encrypt(original, 'caesar');
    const cracked = await crack(encrypted.ciphertext);
    const found = cracked.results.some(r => r.plaintext === original);
    expect(found).toBe(true);
  });

  it('encrypt-then-crack roundtrip for Base64', async () => {
    const original = 'Hello World';
    const encrypted = await encrypt(original, 'base64');
    const cracked = await crack(encrypted.ciphertext);
    const found = cracked.results.some(r => r.plaintext === original);
    expect(found).toBe(true);
  });
});

describe('getEncryptableCipherTypes()', () => {
  it('returns an array of cipher types', () => {
    const types = getEncryptableCipherTypes();
    expect(Array.isArray(types)).toBe(true);
    expect(types.length).toBe(17); // All except hash-lookup
  });

  it('does not include hash-lookup', () => {
    const types = getEncryptableCipherTypes();
    expect(types).not.toContain('hash-lookup');
  });

  it('includes common cipher types', () => {
    const types = getEncryptableCipherTypes();
    expect(types).toContain('caesar');
    expect(types).toContain('rot13');
    expect(types).toContain('base64');
    expect(types).toContain('aes');
  });
});
