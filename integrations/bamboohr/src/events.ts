import type { z } from '@botpress/sdk'
import {
  bambooHrEmployeeWebhookFields,
  type bambooHrEmployeeCreatedEvent,
  type bambooHrEmployeeDeletedEvent,
  type bambooHrEmployeeUpdatedEvent,
} from 'definitions'
import mapValues from 'lodash/mapValues'
import * as bp from '.botpress'

export const handleEmployeeCreatedEvent = async (
  { client }: bp.HandlerProps,
  event: z.output<typeof bambooHrEmployeeCreatedEvent>
) => {
  const { id, timestamp } = event
  await client.createEvent({
    type: 'employeeCreated',
    payload: {
      id,
      timestamp,
    },
  })
}
export const handleEmployeeDeletedEvent = async (
  { client }: bp.HandlerProps,
  event: z.output<typeof bambooHrEmployeeDeletedEvent>
) => {
  const { id, timestamp } = event
  await client.createEvent({
    type: 'employeeDeleted',
    payload: {
      id,
      timestamp,
    },
  })
}

export const handleEmployeeUpdatedEvent = async (
  { client }: bp.HandlerProps,
  event: z.output<typeof bambooHrEmployeeUpdatedEvent>
) => {
  const { id, timestamp, fields, changedFields } = event

  await client.createEvent({
    type: 'employeeUpdated',
    payload: {
      id,
      timestamp,
      changedFields,
      fields: bambooHrEmployeeWebhookFields.parse(mapValues(fields, ({ value }) => value)),
    },
  })
}
