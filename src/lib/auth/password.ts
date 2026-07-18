import { argon2id, argon2Verify } from 'hash-wasm';

// ponytail: argon2id via WASM (hash-wasm) — no native binary, runs on Netlify serverless.
// OWASP argon2id baseline: m=19 MiB, t=2, p=1.
const PARAMS = { parallelism: 1, iterations: 2, memorySize: 19456, hashLength: 32 } as const;
const SALT_BYTES = 16;

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  return argon2id({ password, salt, ...PARAMS, outputType: 'encoded' });
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  return argon2Verify({ password, hash });
}
