export type CipherType =
  | 'caesar'
  | 'rot13'
  | 'atbash'
  | 'vigenere'
  | 'substitution'
  | 'rail-fence'
  | 'playfair'
  | 'columnar-transposition'
  | 'base64'
  | 'base32'
  | 'hex'
  | 'binary'
  | 'url-encoding'
  | 'morse'
  | 'xor'
  | 'hash-lookup'
  | 'aes'
  | 'rsa';

export interface CrackResult {
  plaintext: string;
  cipherType: CipherType;
  confidence: number;
  key?: string | number;
  details?: Record<string, unknown>;
}

export interface CrackResponse {
  results: CrackResult[];
  warnings: string[];
}

export interface DetectionCandidate {
  cipherType: CipherType;
  confidence: number;
  details?: Record<string, unknown>;
}

export interface SolverOptions {
  key?: string | Buffer;
  iv?: string | Buffer;
  maxResults?: number;
}

export interface Solver {
  readonly cipherType: CipherType;
  solve(ciphertext: string, options?: SolverOptions): Promise<CrackResult[]>;
}

export interface PlaintextScore {
  total: number;
  dictionaryWordRatio: number;
  frequencyFit: number;
  bigramFit: number;
  entropyScore: number;
  printableRatio: number;
  spaceFrequency: number;
}
