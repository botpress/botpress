import { schema } from '@bpinternal/opapi'
import { z } from 'zod'
import { authHeaders } from './auth'
import type { OperationFunc } from './types'

export const initializeConversationOperation: OperationFunc = () => ({
  name: 'initializeConversation',
  description:
    'Creates a SSE stream to receive messages and events. The first event will be a payload containing the conversation details.',
  method: 'get',
  path: '/initialize',
  parameters: {
    'x-user-key': { ...authHeaders['x-user-key'], required: false },
    userId: {
      in: 'query',
      type: 'string',
      description: 'User id (if not provided with a user key a new user will be created)',
      required: false,
    },
    conversationId: {
      in: 'query',
      type: 'string',
      description: 'Conversation id',
    },
  },
  section: 'conversation',
  response: {
    description: 'Returns nothing but a stream',
    schema: schema(z.object({})),
  },
})
