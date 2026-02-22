import { describe, it, expect } from 'vitest';
import { detect } from '../../src/detection/detector.js';

describe('detector', () => {
  it('detects base64 encoded text', () => {
    const candidates = detect('SGVsbG8gV29ybGQ=');
    const types = candidates.map(c => c.cipherType);
    expect(types).toContain('base64');
  });

  it('detects hex encoded text', () => {
    const candidates = detect('48656c6c6f');
    const types = candidates.map(c => c.cipherType);
    expect(types).toContain('hex');
  });

  it('detects binary text', () => {
    const candidates = detect('01001000 01101001');
    const types = candidates.map(c => c.cipherType);
    expect(types).toContain('binary');
  });

  it('detects morse code', () => {
    const candidates = detect('.... . .-.. .-.. ---');
    const types = candidates.map(c => c.cipherType);
    expect(types).toContain('morse');
  });

  it('detects URL encoding', () => {
    const candidates = detect('%48%65%6C%6C%6F');
    const types = candidates.map(c => c.cipherType);
    expect(types).toContain('url-encoding');
  });

  it('detects MD5 hash', () => {
    const candidates = detect('5d41402abc4b2a76b9719d911017c592');
    const types = candidates.map(c => c.cipherType);
    expect(types).toContain('hash-lookup');
  });

  it('detects SHA256 hash', () => {
    const hash = '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824';
    const candidates = detect(hash);
    const types = candidates.map(c => c.cipherType);
    expect(types).toContain('hash-lookup');
  });

  it('suggests classic ciphers for alphabetic text', () => {
    const candidates = detect('Uryyb Jbeyq Guvf Vf N Grfg');
    const types = candidates.map(c => c.cipherType);
    expect(types.some(t => ['caesar', 'rot13', 'atbash', 'vigenere', 'substitution'].includes(t))).toBe(true);
  });

  it('returns empty for empty input', () => {
    expect(detect('')).toEqual([]);
    expect(detect('   ')).toEqual([]);
  });

  it('returns candidates sorted by confidence descending', () => {
    const candidates = detect('SGVsbG8gV29ybGQ=');
    for (let i = 1; i < candidates.length; i++) {
      expect(candidates[i].confidence).toBeLessThanOrEqual(candidates[i - 1].confidence);
    }
  });
});
