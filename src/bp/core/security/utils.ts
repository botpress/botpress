import { TokenResponse } from 'common/typings'
import crypto from 'crypto'
import jsonwebtoken from 'jsonwebtoken'
import ms from 'ms'
import uuid from 'uuid'

interface Token {
  email: string
  strategy: string
  tokenVersion: number
  isSuperAdmin: boolean
  expiresIn: string
  audience?: string
}

const generateRandomString = (length: number) => {
  return crypto
    .randomBytes(Math.ceil(length / 2))
    .toString('hex')
    .slice(0, length)
}

const calculateHash = (pw: string, salt: string) => {
  const hash = crypto.createHmac('sha512', salt)
  hash.update(pw)
  return hash.digest('hex')
}

export const saltHashPassword = (password: string) => {
  const salt = generateRandomString(16)
  const hash = calculateHash(password, salt)
  return { salt, hash }
}

export const validateHash = (password: string, hash: string, salt: string) => {
  try {
    return calculateHash(password, salt) === hash
  } catch (err) {
    return false
  }
}

export const generateUserToken = ({
  email,
  strategy,
  tokenVersion,
  isSuperAdmin,
  expiresIn,
  audience
}: Token): TokenResponse => {
  const exp = expiresIn || '2h'
  const csrf = process.USE_JWT_COOKIES ? uuid.v4() : undefined
  const jwt = jsonwebtoken.sign({ email, strategy, tokenVersion, csrfToken: csrf, isSuperAdmin }, process.APP_SECRET, {
    expiresIn: exp,
    audience
  })

  return { jwt, csrf, exp: ms(exp) }
}

export async function getMessageSignature(message: string): Promise<string> {
  if (typeof message !== 'string') {
    throw new Error('Invalid message, expected a string')
  } else if (!message.length) {
    throw new Error('Expected a non-empty string')
  }

  const hmac = crypto.createHmac('sha256', process.APP_SECRET)
  hmac.update(message)
  return hmac.digest('hex')
}
