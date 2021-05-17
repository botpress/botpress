import crypto from 'crypto'

/**
 * @description generates a token based on process app-secret for nlu client (in nlu module) to communicate with nlu server.
 * @returns the token
 */
export const makeNLUPassword = () => {
  const text = `nlu-${process.APP_SECRET}`
  return crypto
    .createHash('sha512')
    .update(text)
    .digest('hex')
}
