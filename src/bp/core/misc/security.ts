import crypto from 'crypto'

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
