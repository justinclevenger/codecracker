/**
 * Character-set analysis for cipher detection.
 */

export interface CharsetProfile {
  totalChars: number;
  alphaCount: number;
  digitCount: number;
  upperCount: number;
  lowerCount: number;
  spaceCount: number;
  punctCount: number;
  nonAsciiCount: number;
  uniqueChars: number;
  alphaRatio: number;
  digitRatio: number;
  upperRatio: number;
  lowerRatio: number;
}

export function analyzeCharset(text: string): CharsetProfile {
  const len = text.length;
  let alpha = 0, digit = 0, upper = 0, lower = 0, space = 0, punct = 0, nonAscii = 0;
  const unique = new Set<string>();

  for (const ch of text) {
    unique.add(ch);
    const code = ch.charCodeAt(0);
    if (code > 127) { nonAscii++; continue; }
    if (ch >= 'A' && ch <= 'Z') { alpha++; upper++; }
    else if (ch >= 'a' && ch <= 'z') { alpha++; lower++; }
    else if (ch >= '0' && ch <= '9') { digit++; }
    else if (ch === ' ') { space++; }
    else { punct++; }
  }

  return {
    totalChars: len,
    alphaCount: alpha,
    digitCount: digit,
    upperCount: upper,
    lowerCount: lower,
    spaceCount: space,
    punctCount: punct,
    nonAsciiCount: nonAscii,
    uniqueChars: unique.size,
    alphaRatio: len > 0 ? alpha / len : 0,
    digitRatio: len > 0 ? digit / len : 0,
    upperRatio: len > 0 ? upper / len : 0,
    lowerRatio: len > 0 ? lower / len : 0,
  };
}

export function isHexString(text: string): boolean {
  return /^[0-9a-fA-F]+$/.test(text.trim()) && text.trim().length % 2 === 0;
}

export function isBase64String(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length < 4) return false;
  return /^[A-Za-z0-9+/]+={0,2}$/.test(trimmed) && trimmed.length % 4 === 0;
}

export function isBase32String(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length < 8) return false;
  return /^[A-Z2-7]+=*$/i.test(trimmed) && trimmed.length % 8 === 0;
}

export function isBinaryString(text: string): boolean {
  return /^[01][\s01]+$/.test(text.trim());
}

export function isMorseString(text: string): boolean {
  return /^[.\-\/ ]+$/.test(text.trim()) && (text.includes('.') || text.includes('-'));
}

export function hasUrlEncoding(text: string): boolean {
  return /%[0-9A-Fa-f]{2}/.test(text);
}
