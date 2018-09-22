import crypto from 'crypto'

export const calculateHash = (s: string): string => {
  const hash = crypto.createHash('sha256')
  hash.update(s)
  return hash.digest('hex')
}

export const validateHash = (s: string, hash: string) => calculateHash(s) === hash
