import { generateKeyPairSync } from 'node:crypto'
import { describe, it } from 'vitest'
import { normalizePkcs8PrivateKey, PKCS8_FOOTER, PKCS8_HEADER } from './pkcs8-private-key'

const RSA_KEY_PAIR = generateKeyPairSync('rsa', { modulusLength: 2048 })
const PKCS8_PRIVATE_KEY = RSA_KEY_PAIR.privateKey.export({ type: 'pkcs8', format: 'pem' }).toString()
const PKCS1_PRIVATE_KEY = RSA_KEY_PAIR.privateKey.export({ type: 'pkcs1', format: 'pem' }).toString()
const PKCS8_BODY = PKCS8_PRIVATE_KEY.replace(PKCS8_HEADER, '').replace(PKCS8_FOOTER, '').trim()

describe.concurrent(normalizePkcs8PrivateKey, () => {
  it.for([
    { case: 'the key with real line breaks', pastedKey: PKCS8_PRIVATE_KEY },
    { case: 'the key as written in a JSON file', pastedKey: PKCS8_PRIVATE_KEY.replaceAll('\n', '\\n') },
    { case: 'the key in quotes as written in a JSON file', pastedKey: JSON.stringify(PKCS8_PRIVATE_KEY) },
    { case: 'the key with line breaks turned into spaces', pastedKey: PKCS8_PRIVATE_KEY.replaceAll('\n', ' ') },
    { case: 'the key with line breaks removed', pastedKey: PKCS8_PRIVATE_KEY.replaceAll('\n', '') },
    { case: 'the key with Windows line breaks', pastedKey: PKCS8_PRIVATE_KEY.replaceAll('\n', '\r\n') },
    { case: 'the key with tabs and blank lines', pastedKey: PKCS8_PRIVATE_KEY.replaceAll('\n', '\n\t\n') },
    { case: 'the body without header and footer', pastedKey: PKCS8_BODY },
    { case: 'the body with \\n and no header or footer', pastedKey: PKCS8_BODY.replaceAll('\n', '\\n') },
    { case: 'the body on one line', pastedKey: PKCS8_BODY.replaceAll('\n', '') },
  ])('returns the key in its standard form when given $case', ({ pastedKey }, { expect }) => {
    // Arrange
    const expectedKey = PKCS8_PRIVATE_KEY

    // Act
    const normalizedKey = normalizePkcs8PrivateKey(pastedKey)

    // Assert
    expect(normalizedKey).toBe(expectedKey)
  })

  it.for([
    { case: 'a PKCS#1 key', pastedKey: PKCS1_PRIVATE_KEY },
    { case: 'a truncated key', pastedKey: PKCS8_PRIVATE_KEY.slice(0, 900) },
    { case: 'a key with an extra letter in its body', pastedKey: PKCS8_PRIVATE_KEY.replace('\n', '\nn') },
    { case: 'text that is not a key', pastedKey: 'Paste the private key of the service account here' },
    { case: 'an empty text', pastedKey: '' },
  ])('throws when given $case', ({ pastedKey }, { expect }) => {
    // Arrange
    const expectedMessage = 'The text is not a PEM-encoded PKCS#8 private key'

    // Act
    const act = () => normalizePkcs8PrivateKey(pastedKey)

    // Assert
    expect(act).toThrow(expectedMessage)
  })
})
