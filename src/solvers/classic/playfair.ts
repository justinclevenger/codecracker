import { BaseSolver } from '../base-solver.js';
import type { CrackResult, SolverOptions } from '../../types.js';
import { scorePlaintext } from '../../analysis/scoring.js';

export class PlayfairSolver extends BaseSolver {
  readonly cipherType = 'playfair' as const;

  async solve(ciphertext: string, options?: SolverOptions): Promise<CrackResult[]> {
    try {
      if (!options?.key || typeof options.key !== 'string') {
        // Cannot crack Playfair without a key
        return [];
      }

      const grid = this.buildGrid(options.key);
      const plaintext = this.decrypt(ciphertext, grid);
      const score = scorePlaintext(plaintext).total;

      return [this.makeResult(plaintext, score, options.key, { method: 'playfair' })];
    } catch {
      return [];
    }
  }

  /**
   * Build a 5x5 Playfair grid from a keyword. Merges I and J.
   */
  private buildGrid(key: string): string[][] {
    const seen = new Set<string>();
    const letters: string[] = [];

    // Normalize: uppercase, merge J -> I
    const normalized = key.toUpperCase().replace(/J/g, 'I');

    for (const ch of normalized) {
      if (ch >= 'A' && ch <= 'Z' && !seen.has(ch)) {
        seen.add(ch);
        letters.push(ch);
      }
    }

    // Fill remaining alphabet (skip J)
    for (let code = 65; code <= 90; code++) {
      const ch = String.fromCharCode(code);
      if (ch === 'J') continue;
      if (!seen.has(ch)) {
        seen.add(ch);
        letters.push(ch);
      }
    }

    // Build 5x5 grid
    const grid: string[][] = [];
    for (let r = 0; r < 5; r++) {
      grid.push(letters.slice(r * 5, r * 5 + 5));
    }

    return grid;
  }

  /**
   * Find the row and column of a character in the grid.
   */
  private findPosition(grid: string[][], ch: string): [number, number] {
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        if (grid[r][c] === ch) {
          return [r, c];
        }
      }
    }
    return [0, 0]; // Should not happen
  }

  /**
   * Decrypt Playfair ciphertext by reversing the Playfair rules.
   */
  private decrypt(ciphertext: string, grid: string[][]): string {
    // Clean input: uppercase, merge J -> I, alpha only
    const clean = ciphertext
      .toUpperCase()
      .replace(/J/g, 'I')
      .replace(/[^A-Z]/g, '');

    // Process in pairs
    let result = '';
    for (let i = 0; i < clean.length - 1; i += 2) {
      const a = clean[i];
      const b = clean[i + 1];

      const [rowA, colA] = this.findPosition(grid, a);
      const [rowB, colB] = this.findPosition(grid, b);

      if (rowA === rowB) {
        // Same row: shift left (reverse of encrypt which shifts right)
        result += grid[rowA][(colA + 4) % 5];
        result += grid[rowB][(colB + 4) % 5];
      } else if (colA === colB) {
        // Same column: shift up (reverse of encrypt which shifts down)
        result += grid[(rowA + 4) % 5][colA];
        result += grid[(rowB + 4) % 5][colB];
      } else {
        // Rectangle: swap columns
        result += grid[rowA][colB];
        result += grid[rowB][colA];
      }
    }

    return result.toLowerCase();
  }
}
