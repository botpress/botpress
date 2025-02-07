import { schema } from '@bpinternal/opapi'
import z from 'zod'
import { eventPayloadSchema } from '../models/event'
import { authHeaders } from './auth'
import { OperationFunc } from './types'

const section = 'event' as const

export const getEventOperation: OperationFunc = (api) => ({
  name: 'getEvent',
  description: 'Retrieves the [Event](#schema_event) object for a valid identifier.',
  method: 'get',
  path: '/events/{id}',
  parameters: {
    ...authHeaders,
    id: {
      in: 'path',
      type: 'string',
      description: 'Id of the Event',
    },
  },
  section,
  response: {
    description: 'Returns an [Event](#schema_event) object if a valid identifier was provided',
    schema: schema(
      z.object({
        event: api.getModelRef('Event'),
      })
    ),
  },
})

export const createEventOperation: OperationFunc = (api) => ({
  name: 'createEvent',
  description: 'Creates a custom [Event](#schema_event)',
  method: 'post',
  path: '/events',
  parameters: authHeaders,
  requestBody: {
    description: 'Event data',
    schema: schema(
      z.object({
        payload: eventPayloadSchema,
        conversationId: schema(z.string(), {
          description: 'ID of the [Conversation](#schema_conversation)',
        }),
      })
    ),
  },
  section,
  response: {
    description: 'Returns a [Event](#schema_event).',
    status: 201,
    schema: schema(
      z.object({
        event: api.getModelRef('Event'),
      })
    ),
  },
})
