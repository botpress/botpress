import * as sdk from '@botpress/sdk'
import { normalizePkcs8PrivateKey, PKCS8_FOOTER, PKCS8_HEADER } from './pkcs8-private-key'

const SERVICE_ACCOUNT_FILE_SCHEMA = sdk.z.object({
  private_key: sdk.z.string().trim().startsWith(PKCS8_HEADER).endsWith(PKCS8_FOOTER),
})

/**
 * Returns the service account's private key in its standard PEM form, from
 * either the key itself or the whole JSON file downloaded from Google Cloud.
 */
export const extractServiceAccountPrivateKey = (pastedText: string): string => {
  const serviceAccountFile = SERVICE_ACCOUNT_FILE_SCHEMA.safeParse(_parseJson(pastedText))
  const pastedKey = serviceAccountFile.success ? serviceAccountFile.data.private_key : pastedText

  try {
    return normalizePkcs8PrivateKey(pastedKey)
  } catch {
    throw new sdk.RuntimeError(
      'The service account private key is not valid. Paste the "private_key" value from the JSON file downloaded from Google Cloud again, or paste the whole file.'
    )
  }
}

const _parseJson = (text: string): unknown => {
  try {
    return JSON.parse(text)
  } catch {
    return undefined
  }
}
