import { z } from '@botpress/sdk'
import { recordEventSchema } from 'src/schemas'
import * as bp from '.botpress'

export const recordCreated = async ({
  payload,
  client,
  logger,
}: {
  payload: z.infer<typeof recordEventSchema>
  client: bp.Client
  logger: bp.Logger
}) => {
  await client.createEvent({
    type: 'recordCreated',
    payload: {
      ...payload,
      event_type: 'record.created',
    },
  })

  logger.forBot().info(`Record created: ${payload.id.record_id}`)
}

export const recordUpdated = async ({
  payload,
  client,
  logger,
}: {
  payload: z.infer<typeof recordEventSchema>
  client: bp.Client
  logger: bp.Logger
}) => {
  await client.createEvent({
    type: 'recordUpdated',
    payload: {
      ...payload,
      event_type: 'record.updated',
    },
  })

  logger.forBot().info(`Record updated: ${payload.id.record_id}`)
}

export const recordDeleted = async ({
  payload,
  client,
  logger,
}: {
  payload: z.infer<typeof recordEventSchema>
  client: bp.Client
  logger: bp.Logger
}) => {
  await client.createEvent({
    type: 'recordDeleted',
    payload: {
      ...payload,
      event_type: 'record.deleted',
    },
  })

  logger.forBot().info(`Record deleted: ${payload.id.record_id}`)
}
