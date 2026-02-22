import { describe, it, expect } from 'vitest';
import {
  analyzeCharset, isHexString, isBase64String,
  isBase32String, isBinaryString, isMorseString, hasUrlEncoding,
} from '../../src/detection/charset.js';

describe('charset analysis', () => {
  describe('analyzeCharset', () => {
    it('correctly profiles alphabetic text', () => {
      const profile = analyzeCharset('Hello World');
      expect(profile.alphaCount).toBe(10);
      expect(profile.spaceCount).toBe(1);
      expect(profile.upperCount).toBe(2);
      expect(profile.lowerCount).toBe(8);
    });

    it('correctly profiles mixed text', () => {
      const profile = analyzeCharset('abc 123 !@#');
      expect(profile.alphaCount).toBe(3);
      expect(profile.digitCount).toBe(3);
      expect(profile.punctCount).toBe(3);
      expect(profile.spaceCount).toBe(2);
    });
  });

  describe('pattern matchers', () => {
    it('detects hex strings', () => {
      expect(isHexString('48656c6c6f')).toBe(true);
      expect(isHexString('DEADBEEF')).toBe(true);
      expect(isHexString('xyz')).toBe(false);
      expect(isHexString('123')).toBe(false); // odd length
    });

    it('detects base64 strings', () => {
      expect(isBase64String('SGVsbG8=')).toBe(true);
      expect(isBase64String('SGVsbG8gV29ybGQ=')).toBe(true);
      expect(isBase64String('ab')).toBe(false); // too short
    });

    it('detects base32 strings', () => {
      expect(isBase32String('JBSWY3DP')).toBe(true);
      expect(isBase32String('abc')).toBe(false);
    });

    it('detects binary strings', () => {
      expect(isBinaryString('01001000 01101001')).toBe(true);
      expect(isBinaryString('hello')).toBe(false);
    });

    it('detects morse strings', () => {
      expect(isMorseString('.... . .-.. .-.. ---')).toBe(true);
      expect(isMorseString('hello')).toBe(false);
    });

    it('detects URL encoding', () => {
      expect(hasUrlEncoding('%48%65%6C')).toBe(true);
      expect(hasUrlEncoding('hello')).toBe(false);
    });
  });
});
