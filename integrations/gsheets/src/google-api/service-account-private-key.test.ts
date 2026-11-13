import { generateKeyPairSync } from 'node:crypto'
import * as sdk from '@botpress/sdk'
import { describe, it } from 'vitest'
import { extractServiceAccountPrivateKey } from './service-account-private-key'

const PKCS8_PRIVATE_KEY = generateKeyPairSync('rsa', { modulusLength: 2048 })
  .privateKey.export({ type: 'pkcs8', format: 'pem' })
  .toString()

const _buildServiceAccountFile = (privateKey: string) =>
  JSON.stringify(
    {
      type: 'service_account',
      project_id: 'customer-records',
      private_key_id: 'abc123',
      private_key: privateKey,
      client_email: 'spreadsheets@botpress.invalid',
      client_id: '123456789',
    },
    null,
    2
  )

describe.concurrent(extractServiceAccountPrivateKey, () => {
  it.for([
    { case: 'the private key alone', pastedText: PKCS8_PRIVATE_KEY },
    { case: 'the private key as written in the JSON file', pastedText: PKCS8_PRIVATE_KEY.replaceAll('\n', '\\n') },
    { case: 'the whole JSON file', pastedText: _buildServiceAccountFile(PKCS8_PRIVATE_KEY) },
    {
      case: 'the whole JSON file between blank lines',
      pastedText: `\n${_buildServiceAccountFile(PKCS8_PRIVATE_KEY)}\n`,
    },
    {
      case: 'a JSON file whose key has spaces instead of line breaks',
      pastedText: _buildServiceAccountFile(PKCS8_PRIVATE_KEY.replaceAll('\n', ' ')),
    },
  ])('returns the key in its standard form when given $case', ({ pastedText }, { expect }) => {
    // Arrange
    const expectedKey = PKCS8_PRIVATE_KEY

    // Act
    const privateKey = extractServiceAccountPrivateKey(pastedText)

    // Assert
    expect(privateKey).toBe(expectedKey)
  })

  it.for([
    { case: 'a JSON file without a private key', pastedText: JSON.stringify({ type: 'service_account' }) },
    {
      case: 'a JSON file whose key has an extra letter in its body',
      pastedText: _buildServiceAccountFile(PKCS8_PRIVATE_KEY.replace('\n', '\nn')),
    },
    { case: 'text that is neither a key nor a JSON file', pastedText: 'spreadsheets@botpress.invalid' },
  ])('refuses $case with a message that explains what to paste', ({ pastedText }, { expect }) => {
    // Arrange
    const expectedError = new sdk.RuntimeError(
      'The service account private key is not valid. Paste the "private_key" value from the JSON file downloaded from Google Cloud again, or paste the whole file.'
    )

    // Act
    const act = () => extractServiceAccountPrivateKey(pastedText)

    // Assert
    expect(act).toThrow(expectedError)
  })
})
