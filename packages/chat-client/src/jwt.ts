import { type JWTPayload, SignJWT } from 'jose'

export async function signJwt(payload: JWTPayload, encryptionKey: string) {
  return await new SignJWT(payload).setProtectedHeader({ alg: 'HS256' }).sign(new TextEncoder().encode(encryptionKey))
}
