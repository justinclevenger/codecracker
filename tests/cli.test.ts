import { describe, it, expect, beforeAll } from 'vitest';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const CLI = './dist/cli.js';

function run(args: string[], stdin?: string): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = execFile('node', [CLI, ...args], (error, stdout, stderr) => {
      // Resolve even on non-zero exit so we can check stderr
      resolve({ stdout, stderr });
    });
    if (stdin !== undefined) {
      child.stdin!.write(stdin);
      child.stdin!.end();
    }
  });
}

describe('CLI', () => {
  beforeAll(async () => {
    // Ensure built artifacts exist
    const { stdout } = await execFileAsync('node', ['-e', `require('fs').accessSync('${CLI}')`]).catch(() => ({ stdout: '' }));
  });

  describe('--help', () => {
    it('prints usage info', async () => {
      const { stdout } = await run(['--help']);
      expect(stdout).toContain('codecracker [options] [ciphertext]');
      expect(stdout).toContain('--detect');
      expect(stdout).toContain('--cipher');
      expect(stdout).toContain('--json');
    });

    it('prints help with -h shorthand', async () => {
      const { stdout } = await run(['-h']);
      expect(stdout).toContain('codecracker [options] [ciphertext]');
    });
  });

  describe('auto-detect and crack', () => {
    it('cracks ROT13 from argument', async () => {
      const { stdout } = await run(['Uryyb Jbeyq']);
      expect(stdout).toContain('Hello World');
      expect(stdout).toContain('confidence:');
    });

    it('cracks Base64 from argument', async () => {
      const { stdout } = await run(['SGVsbG8gV29ybGQ=']);
      expect(stdout).toContain('Hello World');
    });

    it('cracks hex from argument', async () => {
      const { stdout } = await run(['48656c6c6f']);
      expect(stdout).toContain('Hello');
    });
  });

  describe('stdin piping', () => {
    it('reads ciphertext from stdin', async () => {
      const { stdout } = await run([], 'SGVsbG8gV29ybGQ=');
      expect(stdout).toContain('Hello World');
    });
  });

  describe('--detect', () => {
    it('shows detected cipher types without decrypting', async () => {
      const { stdout } = await run(['--detect', 'SGVsbG8gV29ybGQ=']);
      expect(stdout).toContain('Detected cipher types:');
      expect(stdout).toContain('base64');
      expect(stdout).toContain('confidence:');
    });

    it('detects hex encoding', async () => {
      const { stdout } = await run(['--detect', '48656c6c6f']);
      expect(stdout).toContain('hex');
    });
  });

  describe('--cipher', () => {
    it('decrypts with a known cipher type', async () => {
      const { stdout } = await run(['--cipher', 'caesar', 'Khoor Zruog']);
      expect(stdout).toContain('Hello World');
    });

    it('decrypts vigenere with --key', async () => {
      const { stdout } = await run(['--cipher', 'vigenere', '--key', 'key', 'RIJVS']);
      expect(stdout).toContain('HELLO');
    });
  });

  describe('--json', () => {
    it('outputs valid JSON for crack', async () => {
      const { stdout } = await run(['--json', 'Uryyb Jbeyq']);
      const parsed = JSON.parse(stdout);
      expect(parsed).toHaveProperty('results');
      expect(parsed).toHaveProperty('warnings');
      expect(Array.isArray(parsed.results)).toBe(true);
    });

    it('outputs valid JSON for --detect', async () => {
      const { stdout } = await run(['--json', '--detect', 'SGVsbG8gV29ybGQ=']);
      const parsed = JSON.parse(stdout);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed[0]).toHaveProperty('cipherType');
      expect(parsed[0]).toHaveProperty('confidence');
    });
  });

  describe('--top', () => {
    it('limits number of results', async () => {
      const { stdout } = await run(['--top', '1', 'Uryyb Jbeyq']);
      const lines = stdout.split('\n').filter(l => l.startsWith('['));
      expect(lines.length).toBe(1);
    });
  });

  describe('--verbose', () => {
    it('shows quality scores', async () => {
      const { stdout } = await run(['--verbose', 'Uryyb Jbeyq']);
      expect(stdout).toContain('Quality:');
    });
  });

  describe('--encrypt', () => {
    it('encrypts with Caesar cipher', async () => {
      const { stdout } = await run(['--encrypt', '--cipher', 'caesar', 'Hello World']);
      expect(stdout).toContain('[caesar] Khoor Zruog');
      expect(stdout).toContain('Key: 3');
    });

    it('encrypts with Base64', async () => {
      const { stdout } = await run(['--encrypt', '--cipher', 'base64', 'Hello World']);
      expect(stdout).toContain('[base64] SGVsbG8gV29ybGQ=');
    });

    it('encrypts with ROT13', async () => {
      const { stdout } = await run(['--encrypt', '--cipher', 'rot13', 'Hello World']);
      expect(stdout).toContain('[rot13] Uryyb Jbeyq');
    });

    it('outputs valid JSON with --json', async () => {
      const { stdout } = await run(['--json', '--encrypt', '--cipher', 'caesar', 'Hello World']);
      const parsed = JSON.parse(stdout);
      expect(parsed).toHaveProperty('ciphertext', 'Khoor Zruog');
      expect(parsed).toHaveProperty('cipherType', 'caesar');
      expect(parsed).toHaveProperty('key', 3);
    });

    it('errors when --cipher is missing', async () => {
      const { stderr } = await run(['--encrypt', 'Hello']);
      expect(stderr).toContain('--encrypt requires --cipher');
    });

    it('encrypts Vigenere with --key', async () => {
      const { stdout } = await run(['--encrypt', '--cipher', 'vigenere', '--key', 'secret', 'Hello']);
      expect(stdout).toContain('[vigenere]');
      expect(stdout).toContain('Key: secret');
    });
  });

  describe('edge cases', () => {
    it('prints help when stdin closes with no input', async () => {
      // Close stdin immediately to simulate empty pipe
      const { stdout } = await run([], '');
      expect(stdout).toContain('codecracker [options] [ciphertext]');
    });

    it('shows error for unknown flag', async () => {
      const { stderr } = await run(['--bogus']);
      expect(stderr).toContain('Unknown flag');
    });
  });
});
