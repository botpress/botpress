import * as crypto from 'crypto'
import * as bp from '.botpress'

const SIGNATURE_PREFIX = 'hmacsha256='

export const verifyLinkedInWebhook = ({ req, ctx, logger }: bp.HandlerProps): boolean => {
  const signatureHeader = req.headers['x-li-signature']

  if (!signatureHeader) {
    logger.forBot().warn('Missing LinkedIn webhook signature (X-LI-Signature header)')
    return false
  }

  if (!req.body) {
    logger.forBot().warn('Missing webhook body')
    return false
  }

  // LinkedIn signature format: "hmacsha256={signature}"
  if (!signatureHeader.startsWith(SIGNATURE_PREFIX)) {
    logger.forBot().warn(`Invalid signature format - missing ${SIGNATURE_PREFIX} prefix`)
    return false
  }

  const receivedSignature = signatureHeader.slice(SIGNATURE_PREFIX.length)
  const clientSecret = getClientSecret(ctx)

  const expectedSignature = crypto.createHmac('sha256', clientSecret).update(req.body).digest('hex')

  try {
    return crypto.timingSafeEqual(Buffer.from(receivedSignature, 'hex'), Buffer.from(expectedSignature, 'hex'))
  } catch (error) {
    logger.forBot().error('Signature comparison failed', { error })
    return false
  }
}

function getClientSecret(ctx: bp.Context): string {
  if (ctx.configurationType === 'manual') {
    return ctx.configuration.clientSecret
  }
  return bp.secrets.CLIENT_SECRET
}
