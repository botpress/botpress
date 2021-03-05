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

export interface ApiKey {
  email: string
  strategy: string
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

export const generateApiKey = ({ email, strategy }: ApiKey): string => {
  return jsonwebtoken.sign({ email, strategy }, process.APP_SECRET)
}
