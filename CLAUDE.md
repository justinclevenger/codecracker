# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

codecracker is a universal cipher detection and decryption library. It ships as three artifacts:
- **Library** (`src/index.ts`) — ESM + CJS npm package exposing `crack()`, `decrypt()`, `detect()`, and `registerSolver()`
- **CLI** (`src/cli.ts`) — `codecracker` binary (reads ciphertext from arg or stdin)
- **Playground** (`playground/`) — React + Vite + Tailwind web app deployed to GitHub Pages; imports the library source directly via Vite alias (not the built dist)

## Commands

```bash
# Library (root)
npm run build          # tsup → dist/ (ESM, CJS, .d.ts)
npm test               # vitest run (all tests)
npm run test:watch     # vitest in watch mode
npm run typecheck      # tsc --noEmit

# Run a single test file
npx vitest run tests/solvers/classic.test.ts

# Run tests matching a pattern
npx vitest run -t "CaesarSolver"

# CLI tests require a build first (they invoke dist/cli.js via execFile)
npm run build && npx vitest run tests/cli.test.ts

# E2E tests (Playwright, runs against playground dev server)
npm run test:e2e               # headless Chromium
npm run test:e2e:ui            # interactive Playwright UI
npx playwright test e2e/playground.spec.ts  # single file

# Playground (separate package)
cd playground && npm run dev     # Vite dev server
cd playground && npm run build   # tsc -b && vite build
cd playground && npm run lint    # eslint
```

The playground depends on the root library via `"codecracker": "file:.."`. After changing library source, the playground dev server picks up changes automatically (Vite aliases `codecracker` → `../src/index.ts`). For production playground builds, build the library first (`npm run build` in root).

## Architecture

### Pipeline: detect → solve → score → rank

1. **Detection** (`src/detection/`) — Pattern matching (`patterns.ts`) and statistical analysis (Index of Coincidence, Kasiski examination, Shannon entropy) produce ranked `DetectionCandidate[]`
2. **Solving** (`src/solvers/`) — Each cipher has a `Solver` class extending `BaseSolver`. Solvers are organized into `classic/`, `encoding/`, and `modern/` subdirectories
3. **Scoring** (`src/analysis/scoring.ts`) — Composite plaintext quality score (weighted: 35% dictionary, 25% letter frequency, 15% bigram, 10% entropy, 10% printable ratio, 5% space frequency). `finalConfidence = 0.4 × detection + 0.6 × quality`
4. **Cracker** (`src/cracker.ts`) — Orchestrates the pipeline; deduplicates results; attempts recursive decoding for layered encodings (e.g., Base64 wrapping Caesar)

### Solver Registry

Solvers register via `registerSolver()` in a global `Map<CipherType, Solver>`. The `src/index.ts` entry point instantiates and registers all built-in solvers at import time. Plugin authors extend `BaseSolver` and call `registerSolver()`.

### Dictionary Scorer Initialization

The dictionary scorer is injected via `setDictionaryScorer()` at startup to avoid circular imports. Tests that use `scorePlaintext` must call `setDictionaryScorer(dictionaryWordRatio)` before running solver tests (see existing test files for the pattern).

### Key Types

All in `src/types.ts`: `CipherType` (union of 18 cipher strings), `CrackResult`, `CrackResponse`, `DetectionCandidate`, `Solver`, `SolverOptions`, `PlaintextScore`.

### Playground Browser Polyfills

The playground polyfills Node built-ins (`crypto`, `buffer`, `stream`) via `crypto-browserify`, `buffer`, and `stream-browserify` — configured as Vite aliases in `playground/vite.config.ts`. Additionally, `process.browser` and `process.version` are defined globally (required by `readable-stream`), and `Buffer` is injected globally in `main.tsx` before any crypto imports.

## Adding a New Cipher Solver

1. Create `src/solvers/{category}/{name}.ts` extending `BaseSolver`
2. Add the cipher type string to the `CipherType` union in `src/types.ts`
3. Import and register in `src/index.ts`
4. Add detection patterns in `src/detection/patterns.ts` (and/or statistical rules in `detector.ts`)
5. Add tests in `tests/solvers/{category}.test.ts`

## Skills

When working on the **playground** UI, use the `frontend-design` skill for building polished, production-grade components.

When automating browser interactions or testing the playground, use the `agent-browser` skill.
