import { schema } from '@bpinternal/opapi'
import z from 'zod'
import { messagePayloadSchema } from '../models/message'
import { authHeaders } from './auth'
import { OperationFunc } from './types'

const section = 'message' as const

export const getMessageOperation: OperationFunc = (api) => ({
  name: 'getMessage',
  description: 'Retrieves the [Message](#schema_message) object for a valid identifier.',
  method: 'get',
  path: '/messages/{id}',
  parameters: {
    ...authHeaders,
    id: {
      in: 'path',
      type: 'string',
      description: 'Id of the Message',
    },
  },
  section,
  response: {
    description: 'Returns a [Message](#schema_message) object if a valid identifier was provided',
    schema: schema(
      z.object({
        message: api.getModelRef('Message'),
      })
    ),
  },
})

export const createMessageOperation: OperationFunc = (api) => ({
  name: 'createMessage',
  description: 'Creates a new [Message](#schema_message)',
  method: 'post',
  path: '/messages',
  parameters: authHeaders,
  requestBody: {
    description: 'Message data',
    schema: z.object({
      payload: schema(messagePayloadSchema, {
        description: 'Payload is the content type of the message.',
      }),
      conversationId: schema(z.string(), {
        description: 'ID of the [Conversation](#schema_conversation)',
      }),
      metadata: schema(z.record(z.any()).optional(), {
        description: 'Metadata of the message',
      }),
    }),
  },
  section,
  response: {
    description: 'Returns a [Message](#schema_message).',
    status: 201,
    schema: schema(
      z.object({
        message: api.getModelRef('Message'),
      })
    ),
  },
})

export const deleteMessageOperation: OperationFunc = () => ({
  name: 'deleteMessage',
  description: 'Permanently deletes a [Message](#schema_message). It cannot be undone.',
  method: 'delete',
  path: '/messages/{id}',
  parameters: {
    ...authHeaders,
    id: {
      in: 'path',
      type: 'string',
      description: 'Message id',
    },
  },
  section,
  response: {
    description: 'Returns the [Message](#schema_message) object that was deleted',
    schema: z.object({}),
  },
})
