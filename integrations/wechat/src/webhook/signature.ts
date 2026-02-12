import crypto from 'crypto'
import * as bp from '.botpress'

const _computeSignature = (signingSecret: string, timestamp: string, nonce: string): string => {
  // While I think having a "sort" doesn't make sense, this is simply how "WeChat" implements it
  const unhashedSignatureTxt = [signingSecret, timestamp, nonce].sort().join('')
  return crypto.createHash('sha1').update(unhashedSignatureTxt, 'utf8').digest('hex')
}

export const verifyWebhookSignature = ({ req, ctx }: bp.HandlerProps): boolean => {
  const query = new URLSearchParams(req.query)
  const signature = query.get('signature')
  const timestamp = query.get('timestamp') || ''
  const nonce = query.get('nonce') || ''
  const signingSecret = ctx.configuration.webhookSigningSecret

  const computedSignature = _computeSignature(signingSecret, timestamp, nonce)
  return signature === computedSignature
}
