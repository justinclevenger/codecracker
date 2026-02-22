/**
 * Calculate chi-squared statistic between observed and expected distributions.
 */
export function chiSquared(observed: number[], expected: number[]): number {
  let sum = 0;
  for (let i = 0; i < observed.length; i++) {
    if (expected[i] > 0) {
      sum += ((observed[i] - expected[i]) ** 2) / expected[i];
    }
  }
  return sum;
}

/**
 * Greatest common divisor.
 */
export function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    [a, b] = [b, a % b];
  }
  return a;
}

/**
 * Modular arithmetic helper: ((a % n) + n) % n
 */
export function mod(a: number, n: number): number {
  return ((a % n) + n) % n;
}
