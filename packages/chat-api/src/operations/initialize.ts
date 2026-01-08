import { schema } from '@bpinternal/opapi'
import { conversationIdSchema } from 'src/models/conversation'
import { userIdSchema } from 'src/models/user'
import { z } from 'zod'
import { authHeaders } from './auth'
import { createMessageInput } from './message'
import type { OperationFunc } from './types'
import { userInput } from './user'

const initializeBodySchema = schema(
  z.object({
    userId: userIdSchema.optional(),
    user: userInput.optional(),
    conversationId: conversationIdSchema.optional(),
    message: createMessageInput.optional(),
  })
)

export const initializeIncomingMessageOperation: OperationFunc = () => ({
  name: 'initializeIncomingMessage',
  description:
    'Creates a SSE stream to receive messages and events. The first event will be a payload containing the user, conversation and optional message details.',
  method: 'get',
  path: '/initialize-incoming-message',
  requestBody: {
    description: 'User, conversation and optional message data. User and conversation can be set via an id.',
    schema: initializeBodySchema,
  },
  parameters: authHeaders,
  section: 'message',
  response: {
    description: 'Returns nothing but a stream',
    schema: schema(z.object({})),
  },
  tags: ['experimental'],
})
