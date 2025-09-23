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
  const record = events.recordCreated.schema.parse(payload)

  await client.createEvent({
    type: 'recordCreated',
    payload: record,
  })

  logger.forBot().info(`Record created: ${record.id.record_id}`)
}

export const recordUpdated = async ({
  payload,
  client,
  logger,
}: {
  payload: z.infer<typeof events.recordUpdated.schema>
  client: Client
  logger: IntegrationLogger
}) => {
  const record = events.recordUpdated.schema.parse(payload)

  await client.createEvent({
    type: 'recordUpdated',
    payload: record,
  })

  logger.forBot().info(`Record updated: ${record.id.record_id}`)
}

export const recordDeleted = async ({
  payload,
  client,
  logger,
}: {
  payload: z.infer<typeof events.recordDeleted.schema>
  client: Client
  logger: IntegrationLogger
}) => {
  const record = events.recordDeleted.schema.parse(payload)

  await client.createEvent({
    type: 'recordDeleted',
    payload: record,
  })

  logger.forBot().info(`Record deleted: ${record.id.record_id}`)
}
