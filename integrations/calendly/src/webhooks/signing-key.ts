import crypto from 'crypto'

const SIGNING_KEY_BYTES = 32

/** Generate a 256-bit signing key (For Manual PAT Authentication). */
export function generateSigningKey(): string {
  const raw = crypto.randomBytes(SIGNING_KEY_BYTES)
  return raw.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
