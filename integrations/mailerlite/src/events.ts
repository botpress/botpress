import { z } from '@botpress/sdk'
import { subscriberWebhookSchema, webhookSchema } from 'definitions/schemas'
import * as bp from '.botpress'

type Client = bp.Client
type IntegrationLogger = bp.Logger

const subscriberCreated = async ({
  payload,
  client,
  logger,
}: {
  payload: z.infer<typeof webhookSchema>
  client: Client
  logger: IntegrationLogger
}) => {
  logger.forBot().debug('Triggering subscriber created event')
  logger.forBot().debug(`Example Payload ${JSON.stringify(payload)}`)

  const subscriber = subscriberWebhookSchema.parse(payload)

  await client.createEvent({
    type: 'subscriberCreated',
    payload: subscriber,
  })
}

export const events = {
  subscriberCreated,
}
