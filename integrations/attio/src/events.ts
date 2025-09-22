import { z } from '@botpress/sdk'
import { events } from '../definitions/events'
import * as bp from '.botpress'

type Client = bp.Client
type IntegrationLogger = bp.Logger

export const recordCreated = async ({
  payload,
  client,
  logger,
}: {
  payload: z.infer<typeof events.recordCreated.schema>
  client: Client
  logger: IntegrationLogger
}) => {
  logger.forBot().debug('Triggering subscriber created event')
  logger.forBot().debug(`Example Payload ${JSON.stringify(payload)}`)

  const subscriber = events.recordCreated.schema.parse(payload)

  await client.createEvent({
    type: 'recordCreated',
    payload: subscriber,
  })
}
