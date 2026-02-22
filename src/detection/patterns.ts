import type { CipherType, DetectionCandidate } from '../types.js';
import {
  isHexString, isBase64String, isBase32String,
  isBinaryString, isMorseString, hasUrlEncoding,
} from './charset.js';

/**
 * Fast pattern-based detection (Phase 1).
 * Returns candidates sorted by confidence.
 */
export function detectByPattern(text: string): DetectionCandidate[] {
  const candidates: DetectionCandidate[] = [];
  const trimmed = text.trim();
  const len = trimmed.length;

  // Morse code: dots, dashes, spaces, slashes
  if (isMorseString(trimmed) && len >= 3) {
    candidates.push({
      cipherType: 'morse',
      confidence: 0.9,
      details: { reason: 'Contains only morse code characters' },
    });
  }

  // Binary: only 0s, 1s, and spaces
  if (isBinaryString(trimmed) && len >= 8) {
    candidates.push({
      cipherType: 'binary',
      confidence: 0.85,
      details: { reason: 'Contains only binary digits and spaces' },
    });
  }

  // URL encoding: contains %XX patterns
  if (hasUrlEncoding(trimmed)) {
    candidates.push({
      cipherType: 'url-encoding',
      confidence: 0.85,
      details: { reason: 'Contains URL-encoded sequences' },
    });
  }

  // Hash detection by length (hex strings of specific lengths)
  if (isHexString(trimmed)) {
    const hashTypes: Record<number, string> = {
      32: 'MD5', 40: 'SHA1', 64: 'SHA256', 128: 'SHA512',
    };
    const hashType = hashTypes[len];
    if (hashType) {
      candidates.push({
        cipherType: 'hash-lookup',
        confidence: 0.8,
        details: { hashType, reason: `${len}-char hex string matches ${hashType} hash length` },
      });
    }

    // Generic hex
    if (len >= 2 && !hashType) {
      candidates.push({
        cipherType: 'hex',
        confidence: 0.7,
        details: { reason: 'Valid hex string' },
      });
    }
  }

  // Base32: uppercase letters + 2-7 + padding
  if (isBase32String(trimmed) && len >= 8) {
    candidates.push({
      cipherType: 'base32',
      confidence: 0.7,
      details: { reason: 'Valid base32 pattern' },
    });
  }

  // Base64: A-Za-z0-9+/ with optional = padding
  if (isBase64String(trimmed) && len >= 4) {
    // Higher confidence if it has mixed case and/or padding
    const hasPadding = trimmed.endsWith('=');
    const conf = hasPadding ? 0.75 : 0.5;
    candidates.push({
      cipherType: 'base64',
      confidence: conf,
      details: { reason: 'Valid base64 pattern', hasPadding },
    });
  }

  // Alpha-only text suggests classic ciphers
  const alphaOnly = /^[a-zA-Z\s]+$/.test(trimmed);
  if (alphaOnly && len >= 5) {
    // Always consider Caesar/ROT13/Atbash for alphabetic text
    candidates.push(
      { cipherType: 'rot13', confidence: 0.3, details: { reason: 'Alphabetic text' } },
      { cipherType: 'caesar', confidence: 0.3, details: { reason: 'Alphabetic text' } },
      { cipherType: 'atbash', confidence: 0.25, details: { reason: 'Alphabetic text' } },
      { cipherType: 'vigenere', confidence: 0.2, details: { reason: 'Alphabetic text' } },
      { cipherType: 'substitution', confidence: 0.15, details: { reason: 'Alphabetic text' } },
    );
  }

  // Text with spaces and alpha — could be transposition or substitution
  if (/^[a-zA-Z\s.,!?]+$/.test(trimmed) && len >= 10) {
    if (!candidates.some(c => c.cipherType === 'rail-fence')) {
      candidates.push(
        { cipherType: 'rail-fence', confidence: 0.15, details: { reason: 'Alpha text with punctuation' } },
        { cipherType: 'columnar-transposition', confidence: 0.15, details: { reason: 'Alpha text with punctuation' } },
      );
    }
  }

  return candidates.sort((a, b) => b.confidence - a.confidence);
}
