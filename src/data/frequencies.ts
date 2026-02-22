// English letter frequencies (proportion, sums to ~1.0)
export const ENGLISH_LETTER_FREQ: Record<string, number> = {
  a: 0.08167, b: 0.01492, c: 0.02782, d: 0.04253, e: 0.12702,
  f: 0.02228, g: 0.02015, h: 0.06094, i: 0.06966, j: 0.00153,
  k: 0.00772, l: 0.04025, m: 0.02406, n: 0.06749, o: 0.07507,
  p: 0.01929, q: 0.00095, r: 0.05987, s: 0.06327, t: 0.09056,
  u: 0.02758, v: 0.00978, w: 0.02360, x: 0.00150, y: 0.01974,
  z: 0.00074,
};

// Common English bigrams with relative frequencies
export const ENGLISH_BIGRAM_FREQ: Record<string, number> = {
  th: 0.0356, he: 0.0307, in: 0.0243, er: 0.0205, an: 0.0199,
  re: 0.0185, on: 0.0176, at: 0.0149, en: 0.0145, nd: 0.0135,
  ti: 0.0134, es: 0.0134, or: 0.0128, te: 0.0120, of: 0.0117,
  ed: 0.0117, is: 0.0113, it: 0.0112, al: 0.0109, ar: 0.0107,
  st: 0.0105, to: 0.0104, nt: 0.0104, ng: 0.0095, se: 0.0093,
  ha: 0.0093, as: 0.0087, ou: 0.0087, io: 0.0083, le: 0.0083,
  ve: 0.0083, co: 0.0079, me: 0.0079, de: 0.0076, hi: 0.0076,
  ri: 0.0073, ro: 0.0073, ic: 0.0070, ne: 0.0069, ea: 0.0069,
  ra: 0.0069, ce: 0.0065, li: 0.0062, ch: 0.0060, ll: 0.0058,
  be: 0.0058, ma: 0.0057, si: 0.0055, om: 0.0055, ur: 0.0054,
};

// Common English trigrams
export const ENGLISH_TRIGRAM_FREQ: Record<string, number> = {
  the: 0.0181, and: 0.0073, ing: 0.0072, her: 0.0036, hat: 0.0033,
  his: 0.0033, tha: 0.0033, ere: 0.0031, for: 0.0031, ent: 0.0028,
  ion: 0.0028, ter: 0.0028, was: 0.0026, you: 0.0025, ith: 0.0025,
  ver: 0.0024, all: 0.0023, wit: 0.0023, thi: 0.0022, tio: 0.0022,
};

// Index of coincidence for English text
export const ENGLISH_IOC = 0.0667;

// Random text IoC (26 letters equally distributed)
export const RANDOM_IOC = 0.0385;
