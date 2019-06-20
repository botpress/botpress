import { BotpressConfig } from 'core/config/botpress.config'
import crypto from 'crypto'
import jsonwebtoken from 'jsonwebtoken'

const generateRandomString = length => {
  return crypto
    .randomBytes(Math.ceil(length / 2))
    .toString('hex')
    .slice(0, length)
}

const calculateHash = (pw, salt) => {
  const hash = crypto.createHmac('sha512', salt)
  hash.update(pw)
  return hash.digest('hex')
}

export const saltHashPassword = password => {
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

export const generateUserToken = (
  email: string,
  strategy: string,
  isSuperAdmin: boolean,
  expiresIn: string = '6h',
  audience?: string
): string => {
  return jsonwebtoken.sign({ email, strategy, isSuperAdmin }, process.APP_SECRET, { expiresIn, audience })
}
