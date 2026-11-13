import { createPrivateKey } from 'node:crypto'

export const PKCS8_HEADER = '-----BEGIN PRIVATE KEY-----'
export const PKCS8_FOOTER = '-----END PRIVATE KEY-----'

/**
 * Rewrites a PEM-encoded PKCS#8 private key in its standard form, whatever
 * happened to its line breaks when it was copied: real, written as `\n`,
 * turned into spaces or removed. The header and footer may be missing. Throws
 * when the text is not a PKCS#8 private key.
 */
export const normalizePkcs8PrivateKey = (pastedKey: string): string => {
  // Node's base64 decoder skips whitespace, quotes and backslashes, but reads
  // the dashes of the header and footer and the n of each literal \n as key
  // data, so those are removed before decoding:
  const base64Body = pastedKey
    .replaceAll(PKCS8_HEADER, '')
    .replaceAll(PKCS8_FOOTER, '')
    .replaceAll(String.raw`\n`, '')

  try {
    return createPrivateKey({ key: Buffer.from(base64Body, 'base64'), format: 'der', type: 'pkcs8' })
      .export({ type: 'pkcs8', format: 'pem' })
      .toString()
  } catch (thrown: unknown) {
    throw new Error('The text is not a PEM-encoded PKCS#8 private key', { cause: thrown })
  }
}
