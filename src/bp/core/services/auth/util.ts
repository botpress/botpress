import crypto from 'crypto'

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

export const validateHash = (password: string, hash: string, salt: string) => calculateHash(password, salt) === hash
