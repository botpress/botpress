import { schema, zodSchema } from '@bpinternal/opapi'
import z from 'zod'
import { conversationSchema, conversationIdSchema } from '../models/conversation'
import { authHeaders } from './auth'
import { pagedResponseMeta, pagingParameters } from './paging'
import { OperationFunc } from './types'
import { zodRef } from '../api'

const section = 'conversation' as const

export const getConversationOperation: OperationFunc = (api) => ({
  name: 'getConversation',
  description: 'Retrieves the [Conversation](#schema_conversation) object for a valid identifier.',
  method: 'get',
  path: '/conversations/{id}',
  parameters: {
    ...authHeaders,
    id: {
      in: 'path',
      type: 'string',
      description: 'Conversation id',
    },
  },
  section,
  response: {
    description: 'Returns a [Conversation](#schema_conversation) object if a valid identifier was provided',
    schema: zodSchema(schema(
      z.object({
        conversation: zodRef(api.getModelRef('Conversation')),
      })
    )),
  },
})

export const createConversationOperation: OperationFunc = (api) => ({
  name: 'createConversation',
  description: 'Creates a new [Conversation](#schema_conversation)',
  method: 'post',
  path: '/conversations',
  parameters: authHeaders,
  requestBody: {
    description: 'Conversation data',
    schema: zodSchema(z.object({
      id: conversationIdSchema.optional(),
    })),
  },
  section,
  response: {
    status: 201,
    description: 'Returns a [Conversation](#schema_conversation)',
    schema: zodSchema(
      z.object({
        conversation: zodRef(api.getModelRef('Conversation')),
      })
    ),
  },
})

export const getOrCreateConversationOperation: OperationFunc = (api) => ({
  name: 'getOrCreateConversation',
  description: 'Get or create a new [Conversation](#schema_conversation)',
  method: 'post',
  path: '/conversations/get-or-create',
  parameters: authHeaders,
  requestBody: {
    description: 'Conversation data',
    schema: zodSchema(z.object({
      id: conversationIdSchema,
    })),
  },
  section,
  response: {
    status: 201,
    description: 'Returns a [Conversation](#schema_conversation)',
    schema: zodSchema(
      z.object({
        conversation: zodRef(api.getModelRef('Conversation')),
      })
    ),
  },
})

export const deleteConversationOperation: OperationFunc = () => ({
  name: 'deleteConversation',
  description:
    'Permanently deletes a [Conversation](#schema_conversation). It cannot be undone. Also immediately deletes corresponding [Messages](#schema_message).',
  method: 'delete',
  path: '/conversations/{id}',
  parameters: {
    ...authHeaders,
    id: {
      in: 'path',
      type: 'string',
      description: 'Conversation id',
    },
  },
  section,
  response: {
    description: 'Returns the [Conversation](#schema_conversation) object that was deleted',
    schema: zodSchema(z.object({})),
  },
})

export const listConversationsOperation: OperationFunc = () => ({
  name: 'listConversations',
  description: 'Returns a list of [Conversation](#schema_conversation) objects',
  method: 'get',
  path: '/conversations',
  parameters: {
    ...authHeaders,
    ...pagingParameters,
  },
  section,
  response: {
    description: 'Returns a list of [Conversation](#schema_conversation) objects',
    schema: zodSchema(z
      .object({
        conversations: z.array(conversationSchema),
      })
      .extend({ meta: pagedResponseMeta })),
  },
})

export const listenConversationOperation: OperationFunc = () => ({
  name: 'listenConversation',
  description: 'Creates a SSE stream to receive messages and events from a conversation',
  method: 'get',
  path: '/conversations/{id}/listen',
  parameters: {
    ...authHeaders,
    id: {
      in: 'path',
      type: 'string',
      description: 'Conversation id',
    },
  },
  section,
  response: {
    description: 'Returns nothing but a stream',
    schema: zodSchema(z.object({})),
  },
})

export const listMessagesOperation: OperationFunc = (api) => ({
  name: 'listMessages',
  description: "Retrieves the conversation's [Messages](#schema_message)",
  method: 'get',
  path: '/conversations/{conversationId}/messages',
  parameters: {
    ...authHeaders,
    ...pagingParameters,
    conversationId: {
      in: 'path',
      type: 'string',
      description: 'Conversation id',
    },
  },
  section,
  response: {
    description: 'Returns a list of [Message](#schema_message) objects',
    schema: zodSchema(z
      .object({
        messages: z.array(zodRef(api.getModelRef('Message'))),
      })
      .extend({ meta: pagedResponseMeta })),
  },
})

export const addParticipantOperation: OperationFunc = (api) => ({
  name: 'addParticipant',
  description: 'Add a [Participant](#schema_user) to a [Conversation](#schema_conversation).',
  method: 'post',
  path: '/conversations/{conversationId}/participants',
  parameters: {
    ...authHeaders,
    conversationId: {
      in: 'path',
      type: 'string',
      description: 'Conversation id',
    },
  },
  requestBody: {
    description: 'Participant data',
    schema: zodSchema(
      z.object({
        userId: schema(z.string(), { description: 'User id' }),
      })
    ),
  },
  section,
  response: {
    description: 'Returns the [Participant](#schema_user) object',
    schema: zodSchema(
      z.object({
        participant: zodRef(api.getModelRef('User')),
      })
    ),
  },
})

export const removeParticipantOperation: OperationFunc = () => ({
  name: 'removeParticipant',
  description: 'Remove a [Participant](#schema_user) from a [Conversation](#schema_conversation).',
  method: 'delete',
  path: '/conversations/{conversationId}/participants/{userId}',
  parameters: {
    ...authHeaders,
    conversationId: {
      in: 'path',
      type: 'string',
      description: 'Conversation id',
    },
    userId: {
      in: 'path',
      type: 'string',
      description: 'User id',
    },
  },
  section,
  response: {
    description: 'Returns an empty object',
    schema: zodSchema(z.object({})),
  },
})

export const getParticipantOperation: OperationFunc = (api) => ({
  name: 'getParticipant',
  description: 'Retrieves a [Participant](#schema_user) from a [Conversation](#schema_conversation).',
  method: 'get',
  path: '/conversations/{conversationId}/participants/{userId}',
  parameters: {
    ...authHeaders,
    conversationId: {
      in: 'path',
      type: 'string',
      description: 'Conversation id',
    },
    userId: {
      in: 'path',
      type: 'string',
      description: 'User id',
    },
  },
  section,
  response: {
    description: 'Returns the [Participant](#schema_user) object',
    schema: zodSchema(
      z.object({
        participant: zodRef(api.getModelRef('User')),
      })
    ),
  },
})

export const listParticipantsOperation: OperationFunc = (api) => ({
  name: 'listParticipants',
  description: 'Retrieves a list of [Participants](#schema_user) for a given [Conversation](#schema_conversation).',
  method: 'get',
  path: '/conversations/{conversationId}/participants',
  parameters: {
    ...authHeaders,
    ...pagingParameters,
    conversationId: {
      in: 'path',
      type: 'string',
      description: 'Conversation id',
    },
  },
  section,
  response: {
    description: 'Returns a list of [Participants](#schema_user) objects',
    schema: zodSchema(z
      .object({
        participants: z.array(zodRef(api.getModelRef('User'))),
      })
      .extend({ meta: pagedResponseMeta })),
  },
})
