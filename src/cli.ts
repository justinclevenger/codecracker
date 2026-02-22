import { crack, decrypt, detect } from './index.js';
import type { CrackResult, DetectionCandidate, CrackResponse } from './types.js';

interface CliArgs {
  help: boolean;
  detect: boolean;
  cipher?: string;
  key?: string;
  top: number;
  json: boolean;
  verbose: boolean;
  ciphertext?: string;
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {
    help: false,
    detect: false,
    top: 5,
    json: false,
    verbose: false,
  };

  const rest = argv.slice(2);
  let i = 0;

  while (i < rest.length) {
    const arg = rest[i];

    if (arg === '--help' || arg === '-h') {
      args.help = true;
    } else if (arg === '--detect') {
      args.detect = true;
    } else if (arg === '--json') {
      args.json = true;
    } else if (arg === '--verbose' || arg === '-v') {
      args.verbose = true;
    } else if (arg === '--cipher') {
      i++;
      args.cipher = rest[i];
    } else if (arg === '--key') {
      i++;
      args.key = rest[i];
    } else if (arg === '--top') {
      i++;
      args.top = parseInt(rest[i], 10) || 5;
    } else if (!arg.startsWith('-')) {
      args.ciphertext = arg;
    } else {
      process.stderr.write(`Unknown flag: ${arg}\n`);
      process.exit(1);
    }

    i++;
  }

  return args;
}

function printHelp(): void {
  const help = `
codecracker [options] [ciphertext]

Auto-detect and crack ciphers from the terminal.

Usage:
  codecracker "Uryyb Jbeyq"                          # auto-detect & crack
  echo "SGVsbG8gV29ybGQ=" | codecracker               # pipe from stdin
  codecracker --detect "SGVsbG8gV29ybGQ="              # detect only
  codecracker --cipher caesar "Khoor Zruog"            # known cipher type
  codecracker --cipher vigenere --key SECRET "text"     # with key
  codecracker --top 3 --json "Uryyb Jbeyq"             # JSON, top 3

Flags:
  --detect          Only detect cipher type, don't decrypt
  --cipher <type>   Specify cipher type (skip auto-detection)
  --key <key>       Provide decryption key
  --top <n>         Max results (default: 5)
  --json            Output as JSON
  --verbose, -v     Show details and quality scores
  --help, -h        Show this help
`.trimStart();

  process.stdout.write(help);
}

function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    // If stdin is a TTY (no piped input), resolve empty immediately
    if (process.stdin.isTTY) {
      resolve('');
      return;
    }

    let data = '';
    process.stdin.setEncoding('utf-8');
    process.stdin.on('data', (chunk: string) => { data += chunk; });
    process.stdin.on('end', () => resolve(data.trim()));
    process.stdin.on('error', reject);
  });
}

function formatConfidence(confidence: number): string {
  return `${Math.round(confidence * 100)}%`;
}

function formatDetectionResults(candidates: DetectionCandidate[], args: CliArgs): void {
  if (args.json) {
    process.stdout.write(JSON.stringify(candidates, null, 2) + '\n');
    return;
  }

  process.stdout.write('Detected cipher types:\n');
  candidates.slice(0, args.top).forEach((c, i) => {
    process.stdout.write(`  ${i + 1}. ${c.cipherType.padEnd(12)} (confidence: ${formatConfidence(c.confidence)})\n`);
    if (args.verbose && c.details) {
      for (const [key, value] of Object.entries(c.details)) {
        process.stdout.write(`     ${key}: ${JSON.stringify(value)}\n`);
      }
    }
  });
}

function formatCrackResults(response: CrackResponse, args: CliArgs): void {
  if (args.json) {
    process.stdout.write(JSON.stringify(response, null, 2) + '\n');
    return;
  }

  if (response.warnings.length > 0 && args.verbose) {
    for (const w of response.warnings) {
      process.stderr.write(`Warning: ${w}\n`);
    }
  }

  if (response.results.length === 0) {
    process.stderr.write('No results found.\n');
    if (response.warnings.length > 0 && !args.verbose) {
      for (const w of response.warnings) {
        process.stderr.write(`Warning: ${w}\n`);
      }
    }
    process.exit(1);
  }

  response.results.slice(0, args.top).forEach((r: CrackResult) => {
    process.stdout.write(`[${r.cipherType}] ${r.plaintext}  (confidence: ${formatConfidence(r.confidence)})\n`);
    if (r.key !== undefined) {
      process.stdout.write(`  Key: ${r.key}\n`);
    }
    if (args.verbose && r.details) {
      const { qualityScore, ...otherDetails } = r.details as Record<string, unknown>;
      if (qualityScore && typeof qualityScore === 'object') {
        const qs = qualityScore as Record<string, number>;
        process.stdout.write(`  Quality: total=${qs.total?.toFixed(3)} dict=${qs.dictionaryWordRatio?.toFixed(3)} freq=${qs.frequencyFit?.toFixed(3)}\n`);
      }
      for (const [key, value] of Object.entries(otherDetails)) {
        process.stdout.write(`  ${key}: ${JSON.stringify(value)}\n`);
      }
    }
  });
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv);

  if (args.help) {
    printHelp();
    return;
  }

  // Get ciphertext from args or stdin
  let ciphertext = args.ciphertext;
  if (!ciphertext) {
    ciphertext = await readStdin();
  }

  if (!ciphertext) {
    printHelp();
    process.exit(1);
  }

  // --detect mode
  if (args.detect) {
    const candidates = detect(ciphertext);
    formatDetectionResults(candidates, args);
    return;
  }

  // --cipher mode (known cipher type)
  if (args.cipher) {
    const results = await decrypt(ciphertext, args.cipher as any, {
      key: args.key,
      maxResults: args.top,
    });
    formatCrackResults({ results, warnings: [] }, args);
    return;
  }

  // Default: auto-detect and crack
  const response = await crack(ciphertext, {
    maxResults: args.top,
    key: args.key,
  });
  formatCrackResults(response, args);
}

main().catch((err: Error) => {
  process.stderr.write(`Error: ${err.message}\n`);
  process.exit(1);
});
