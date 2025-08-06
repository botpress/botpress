import { IntegrationProps } from '@botpress/sdk'
import crypto from 'crypto'

type IntegrationHandler = IntegrationProps['handler']
type IntegrationHandlerProps = Pick<Parameters<IntegrationHandler>[0], 'req'>

export const validateRequestSignature = async ({
  req,
  clientSecret,
}: IntegrationHandlerProps & { clientSecret?: string }) => {
  if (!clientSecret) {
    return { error: false }
  }

  const expectedSignature = crypto
    .createHmac('sha256', clientSecret)
    .update(req.body ?? '')
    .digest('hex')
  const signature = req.headers['x-hub-signature-256']?.split('=')[1]
  if (signature !== expectedSignature) {
    return { error: true, message: `Invalid signature (got ${signature ?? 'none'}, expected ${expectedSignature})` }
  }

  return { error: false }
}
