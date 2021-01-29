import crypto from 'crypto'
import jsonwebtoken from 'jsonwebtoken'

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
}: Token): string => {
  return jsonwebtoken.sign({ email, strategy, tokenVersion, isSuperAdmin }, process.APP_SECRET, {
    expiresIn: expiresIn || '2h',
    audience
  })
}
