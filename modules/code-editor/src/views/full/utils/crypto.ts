import crypto from 'crypto'

export const calculateHash = content => {
  return crypto
    .createHash('sha256')
    .update(content)
    .digest('hex')
}
