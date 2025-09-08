import { IntegrationLogger, Request } from '@botpress/sdk'

export const verifyRequest = async (req: Request, logger: IntegrationLogger) => {
  const eventId = req.headers['webhook-id']
  const timeStamp = req.headers['webhook-timestamp']
  const webhookSignature = req.headers['webhook-signature']

  if (!eventId || !timeStamp || !webhookSignature) {
    logger.error('Missing required headers')
    return false
  }

  return true
}