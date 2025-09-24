import { z } from '@botpress/sdk'
import { recordCreatedEventSchema, recordUpdatedEventSchema, recordDeletedEventSchema } from 'src/schemas'
import * as bp from '.botpress'

type Client = bp.Client
type IntegrationLogger = bp.Logger

export const recordCreated = async ({
  payload,
  client,
  logger,
}: {
  payload: z.infer<typeof recordCreatedEventSchema>
  client: Client
  logger: IntegrationLogger
}) => {
  await client.createEvent({
    type: 'recordCreated',
    payload,
  })

  logger.forBot().info(`Record created: ${payload.id.record_id}`)
}

export const recordUpdated = async ({
  payload,
  client,
  logger,
}: {
  payload: z.infer<typeof recordUpdatedEventSchema>
  client: Client
  logger: IntegrationLogger
}) => {
  await client.createEvent({
    type: 'recordUpdated',
    payload,
  })

  logger.forBot().info(`Record updated: ${payload.id.record_id}`)
}

export const recordDeleted = async ({
  payload,
  client,
  logger,
}: {
  payload: z.infer<typeof recordDeletedEventSchema>
  client: Client
  logger: IntegrationLogger
}) => {
  await client.createEvent({
    type: 'recordDeleted',
    payload,
  })

  logger.forBot().info(`Record deleted: ${payload.id.record_id}`)
}
