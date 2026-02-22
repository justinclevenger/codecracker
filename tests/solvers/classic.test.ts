import { describe, it, expect } from 'vitest';
import { dictionaryWordRatio } from '../../src/analysis/dictionary.js';
import { setDictionaryScorer } from '../../src/analysis/scoring.js';
import { CaesarSolver } from '../../src/solvers/classic/caesar.js';
import { Rot13Solver } from '../../src/solvers/classic/rot13.js';
import { AtbashSolver } from '../../src/solvers/classic/atbash.js';
import { VigenereSolver } from '../../src/solvers/classic/vigenere.js';
import { RailFenceSolver } from '../../src/solvers/classic/rail-fence.js';
import { SubstitutionSolver } from '../../src/solvers/classic/substitution.js';

// Initialize the dictionary scorer before any solver that uses scorePlaintext
setDictionaryScorer(dictionaryWordRatio);

describe('CaesarSolver', () => {
  const solver = new CaesarSolver();

  it('decrypts a Caesar cipher with shift 3', async () => {
    // "Hello World" shifted by 3: H->K, e->h, l->o, l->o, o->r, W->Z, o->r, r->u, l->o, d->g
    const ciphertext = 'Khoor Zruog';
    const results = await solver.solve(ciphertext);

    expect(results.length).toBeGreaterThan(0);

    // "Hello World" should appear in the top results
    const plaintexts = results.map(r => r.plaintext);
    expect(plaintexts).toContain('Hello World');
  });

  it('returns the correct shift 3 in top 3 results', async () => {
    const ciphertext = 'Khoor Zruog';
    const results = await solver.solve(ciphertext);

    // The result with shift=3 should be among the top 3
    const top3 = results.slice(0, 3);
    const shifts = top3.map(r => r.key);
    expect(shifts).toContain(3);
  });

  it('respects maxResults option', async () => {
    const results = await solver.solve('Khoor Zruog', { maxResults: 3 });
    expect(results.length).toBeLessThanOrEqual(3);
  });

  it('solve returns non-empty array for alphabetic input', async () => {
    const results = await solver.solve('Lipps Asvph');
    expect(results.length).toBeGreaterThan(0);
  });

  it('results have valid confidence scores between 0 and 1', async () => {
    const results = await solver.solve('Khoor Zruog');
    for (const result of results) {
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    }
  });
});

describe('Rot13Solver', () => {
  const solver = new Rot13Solver();

  it('decrypts ROT13 cipher', async () => {
    // "Hello World" ROT13: H->U, e->r, l->y, l->y, o->b, W->J, o->b, r->e, l->y, d->q
    const ciphertext = 'Uryyb Jbeyq';
    const results = await solver.solve(ciphertext);

    expect(results).toHaveLength(1);
    expect(results[0].plaintext).toBe('Hello World');
    expect(results[0].cipherType).toBe('rot13');
    expect(results[0].key).toBe(13);
  });

  it('ROT13 is its own inverse', async () => {
    const results = await solver.solve('Hello World');

    expect(results).toHaveLength(1);
    // Applying ROT13 twice returns the original
    const doubleResults = await solver.solve(results[0].plaintext);
    expect(doubleResults[0].plaintext).toBe('Hello World');
  });

  it('solve returns non-empty array', async () => {
    const results = await solver.solve('Grfg');
    expect(results.length).toBeGreaterThan(0);
  });
});

describe('AtbashSolver', () => {
  const solver = new AtbashSolver();

  it('decrypts Atbash cipher', async () => {
    // Atbash: A<->Z, B<->Y, ..., H->S, e->v, l->o, l->o, o->l
    // "Hello World" -> S(H) v(e) o(l) o(l) l(o) D(W) l(o) i(r) o(l) w(d)
    // H(7)->S(18): 25-7=18 -> S. Correct: 90-(72-65)=83=S
    // e(4)->v(21): 122-(101-97)=118=v
    // l(11)->o(14): 122-(108-97)=111=o
    // o(14)->l(11): 122-(111-97)=108=l
    // W(22)->D(3): 90-(87-65)=68=D
    // r(17)->i(8): 122-(114-97)=105=i
    // d(3)->w(22): 122-(100-97)=119=w
    const ciphertext = 'Svool Dliow';
    const results = await solver.solve(ciphertext);

    expect(results).toHaveLength(1);
    expect(results[0].plaintext).toBe('Hello World');
    expect(results[0].cipherType).toBe('atbash');
  });

  it('Atbash is its own inverse', async () => {
    const results = await solver.solve('Svool Dliow');
    expect(results).toHaveLength(1);

    const doubleResults = await solver.solve(results[0].plaintext);
    expect(doubleResults[0].plaintext).toBe('Svool Dliow');
  });

  it('solve returns non-empty array', async () => {
    const results = await solver.solve('Gvhg');
    expect(results.length).toBeGreaterThan(0);
  });
});

describe('VigenereSolver', () => {
  const solver = new VigenereSolver();

  it('decrypts with a known key', async () => {
    // Encrypt "HELLOWORLD" with key "KEY" (K=10, E=4, Y=24):
    // H(7)+K(10)=17=R, E(4)+E(4)=8=I, L(11)+Y(24)=35%26=9=J
    // L(11)+K(10)=21=V, O(14)+E(4)=18=S, W(22)+Y(24)=46%26=20=U
    // O(14)+K(10)=24=Y, R(17)+E(4)=21=V, L(11)+Y(24)=35%26=9=J
    // D(3)+K(10)=13=N
    const ciphertext = 'RIJVSUYVJN';
    const results = await solver.solve(ciphertext, { key: 'KEY' });

    expect(results).toHaveLength(1);
    expect(results[0].plaintext).toBe('HELLOWORLD');
    expect(results[0].cipherType).toBe('vigenere');
    expect(results[0].key).toBe('key');
  });

  it('decrypts with known key preserving case', async () => {
    // Mixed case test: "Hello" with key "KEY"
    // H(7)+K(10)=17=R, e(4)+E(4)=8=i, l(11)+Y(24)=9=j
    // l(11)+K(10)=21=v, o(14)+E(4)=18=s
    const ciphertext = 'Rijvs';
    const results = await solver.solve(ciphertext, { key: 'KEY' });

    expect(results).toHaveLength(1);
    expect(results[0].plaintext).toBe('Hello');
  });

  it('returns empty array for very short input without key', async () => {
    // Less than 10 alpha chars -> returns []
    const results = await solver.solve('ABCDE');
    expect(results).toEqual([]);
  });

  it('solve returns non-empty array for sufficiently long ciphertext without key', async () => {
    // Encrypt a longer English text with key "SECRET"
    const plaintext = 'THEQUICKBROWNFOXJUMPSOVERTHELAZYDOG';
    const key = 'SECRET';
    let encrypted = '';
    for (let i = 0; i < plaintext.length; i++) {
      const pCode = plaintext.charCodeAt(i) - 65;
      const kCode = key.charCodeAt(i % key.length) - 65;
      encrypted += String.fromCharCode(((pCode + kCode) % 26) + 65);
    }

    const results = await solver.solve(encrypted);
    expect(results.length).toBeGreaterThan(0);
  });

  it('results have valid structure', async () => {
    const results = await solver.solve('RIJVSUYVJN', { key: 'KEY' });
    expect(results[0]).toHaveProperty('plaintext');
    expect(results[0]).toHaveProperty('cipherType');
    expect(results[0]).toHaveProperty('confidence');
    expect(results[0]).toHaveProperty('key');
    expect(results[0].details).toHaveProperty('keyLength');
  });
});

describe('RailFenceSolver', () => {
  const solver = new RailFenceSolver();

  it('decrypts a rail-fence cipher with known rails', async () => {
    // Encrypt "HELLOWORLD" with 3 rails:
    // Rail pattern (3 rails): 0,1,2,1,0,1,2,1,0,1
    // pos 0: rail 0 -> H
    // pos 1: rail 1 -> E
    // pos 2: rail 2 -> L
    // pos 3: rail 1 -> L
    // pos 4: rail 0 -> O
    // pos 5: rail 1 -> W
    // pos 6: rail 2 -> O
    // pos 7: rail 1 -> R
    // pos 8: rail 0 -> L
    // pos 9: rail 1 -> D
    // Rail 0: H, O, L -> "HOL"
    // Rail 1: E, L, W, R, D -> "ELWRD"
    // Rail 2: L, O -> "LO"
    // Ciphertext: "HOLELWRDLO"
    const ciphertext = 'HOLELWRDLO';
    const results = await solver.solve(ciphertext);

    expect(results.length).toBeGreaterThan(0);

    // The result with rails=3 should produce "HELLOWORLD"
    const rail3Result = results.find(r => r.key === 3);
    expect(rail3Result).toBeDefined();
    expect(rail3Result!.plaintext).toBe('HELLOWORLD');
  });

  it('solve returns non-empty array for valid input', async () => {
    const results = await solver.solve('HOLELWRDLO');
    expect(results.length).toBeGreaterThan(0);
  });

  it('all results have valid confidence scores', async () => {
    const results = await solver.solve('HOLELWRDLO');
    for (const result of results) {
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
      expect(result.cipherType).toBe('rail-fence');
    }
  });

  it('respects maxResults option', async () => {
    const results = await solver.solve('HOLELWRDLO', { maxResults: 2 });
    expect(results.length).toBeLessThanOrEqual(2);
  });
});

describe('SubstitutionSolver', () => {
  const solver = new SubstitutionSolver();

  it('decrypts with a known key alphabet', async () => {
    // Key alphabet: key[i] decrypts to String.fromCharCode(97 + i)
    // Use a simple reversed alphabet (atbash-like): key[0]='z' means cipher 'z' -> plain 'a'
    // key = "zyxwvutsrqponmlkjihgfedcba"
    // Encrypting "hello": h->s, e->v, l->o, l->o, o->l => ciphertext "svool"
    const keyAlphabet = 'zyxwvutsrqponmlkjihgfedcba';
    const ciphertext = 'svool';
    const results = await solver.solve(ciphertext, { key: keyAlphabet });

    expect(results).toHaveLength(1);
    expect(results[0].plaintext).toBe('hello');
    expect(results[0].cipherType).toBe('substitution');
  });

  it('preserves case with known key', async () => {
    const keyAlphabet = 'zyxwvutsrqponmlkjihgfedcba';
    // "Hello" encrypted: H->S, e->v, l->o, l->o, o->l => "Svool"
    const ciphertext = 'Svool';
    const results = await solver.solve(ciphertext, { key: keyAlphabet });

    expect(results).toHaveLength(1);
    expect(results[0].plaintext).toBe('Hello');
  });

  it('attempts frequency analysis without a key', async () => {
    // Use a long enough ciphertext for frequency analysis to work
    const ciphertext = 'Gur dhvpx oebja sbk whzcf bire gur ynml qbt';
    const results = await solver.solve(ciphertext);

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].cipherType).toBe('substitution');
    expect(results[0]).toHaveProperty('key');
  });

  it('solve returns non-empty array', async () => {
    const results = await solver.solve('test message for the solver');
    expect(results.length).toBeGreaterThan(0);
  });

  it('results have valid details', async () => {
    const keyAlphabet = 'zyxwvutsrqponmlkjihgfedcba';
    const results = await solver.solve('svool', { key: keyAlphabet });

    expect(results[0].details).toBeDefined();
    expect(results[0].details!.method).toBe('substitution');
  });
});
