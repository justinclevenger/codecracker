import { BaseSolver } from '../base-solver.js';
import type { CrackResult, SolverOptions } from '../../types.js';
import { createHash } from 'node:crypto';

const COMMON_PASSWORDS: string[] = [
  'password', '123456', '12345678', '1234', 'qwerty', '12345', 'dragon',
  'pussy', 'baseball', 'football', 'letmein', 'monkey', 'abc123',
  'mustang', 'michael', 'shadow', 'master', 'jennifer', '111111',
  '2000', 'jordan', 'superman', 'harley', '1234567', 'fuckme',
  'hunter', 'fuckyou', 'trustno1', 'ranger', 'buster', 'thomas',
  'tigger', 'robert', 'soccer', 'fuck', 'batman', 'test', 'pass',
  'killer', 'hockey', 'george', 'charlie', 'andrew', 'michelle',
  'love', 'sunshine', 'jessica', 'asshole', '6969', 'pepper',
  'daniel', 'access', '123456789', '654321', 'joshua', 'maggie',
  'starwars', 'silver', 'william', 'dallas', 'yankees', '123123',
  'ashley', '666666', 'hello', 'amanda', 'orange', 'biteme',
  'freedom', 'computer', 'sexy', 'thunder', 'nicole', 'ginger',
  'heather', 'hammer', 'summer', 'corvette', 'taylor', 'fucker',
  'austin', '1111', 'merlin', 'matthew', '121212', 'golfer',
  'cheese', 'princess', 'martin', 'chelsea', 'patrick', 'richard',
  'diamond', 'yellow', 'bigdog', 'secret', 'asdfgh', 'sparky',
  'cowboy', 'camaro', 'matrix', 'falcon', 'iloveyou', 'guitar',
  'purple', 'scooter', 'phoenix', 'aaaaaa', 'tigers', 'cougar',
  'chicken', 'beaver', 'eagle', 'mercedes', 'sam', 'winner',
  'admin', 'root', 'administrator', 'guest', 'welcome', 'login',
  'changeme', 'passw0rd', 'p@ssword', 'p@ssw0rd', 'default',
  'qwerty123', 'letmein1', 'password1', 'password123', '1q2w3e',
  '1q2w3e4r', 'qazwsx', 'zxcvbn', 'zxcvbnm', 'asdfghjkl',
  'qwerty1', 'abc', 'abcdef', 'abcd1234', 'iloveu', 'monkey1',
  'dragon1', 'master1', 'apple', 'banana', 'coffee', 'cookie',
  'internet', 'whatever', 'nothing', 'something', 'people',
  'friend', 'angel', 'angel1', 'baby', 'pretty', 'lovely',
  'soccer1', 'hockey1', 'football1', 'baseball1', 'trustno',
  'maria', 'thomas1', 'qwe123', '159753', '147258', '321654',
  'letmein2', 'charlie1', 'midnight', 'flower', 'jasmine',
  'butterfly', 'shadow1', 'killer1', 'buster1', 'happy',
  'happy1', 'friday', 'monday', 'junior', 'senior', 'yankee',
  'dragon12', 'mike', 'james', 'david', 'kevin', 'steven',
  'pepper1', 'power', 'family', 'music', 'ninja', 'pirate',
  'zombie', 'princess1', 'diamond1', 'gold', 'platinum',
  'blahblah', 'password2', 'hello1', 'world', 'helloworld',
];

type HashAlgorithm = 'md5' | 'sha1' | 'sha256';

export class HashLookupSolver extends BaseSolver {
  readonly cipherType = 'hash-lookup' as const;

  async solve(ciphertext: string, _options?: SolverOptions): Promise<CrackResult[]> {
    const input = ciphertext.trim().toLowerCase();

    if (!this.isHex(input)) {
      return [];
    }

    const algorithm = this.detectHashType(input);

    if (!algorithm) {
      return [];
    }

    try {
      for (const candidate of COMMON_PASSWORDS) {
        const hash = createHash(algorithm).update(candidate).digest('hex');

        if (hash === input) {
          return [this.makeResult(candidate, 0.99, undefined, {
            hashType: algorithm.toUpperCase(),
            method: 'dictionary-lookup',
          })];
        }
      }

      return [];
    } catch {
      return [];
    }
  }

  private detectHashType(input: string): HashAlgorithm | null {
    switch (input.length) {
      case 32:
        return 'md5';
      case 40:
        return 'sha1';
      case 64:
        return 'sha256';
      default:
        return null;
    }
  }

  private isHex(input: string): boolean {
    if (input.length === 0) {
      return false;
    }

    return /^[0-9a-f]+$/.test(input);
  }
}
