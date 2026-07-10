import { type JWTPayload, SignJWT } from 'jose'
import { ChatClientError } from './errors'

export async function signJwt(payload: JWTPayload, encryptionKey: string) {
  try {
    return await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .sign(new TextEncoder().encode(encryptionKey))
  } catch (thrown: unknown) {
    throw ChatClientError.wrap(
      thrown,
      'Failed to sign the user key. Signing requires the WebCrypto API (Node.js 20+, or a secure context in browsers).'
    )
  }
}
