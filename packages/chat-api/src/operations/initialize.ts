import { schema } from '@bpinternal/opapi'
import { z } from 'zod'
import { conversationIdSchema } from '../models/conversation'
import { messageInput } from '../models/message'
import { userInput, userSchema } from '../models/user'
import { authHeaders } from './auth'
import type { OperationFunc } from './types'

const initializeBodySchema = schema(
  z.object({
    user: userInput.optional(),
    conversationId: conversationIdSchema.optional(),
    message: messageInput.optional(),
  })
)

export const initializeIncomingMessageOperation: OperationFunc = (api) => ({
  name: 'initializeIncomingMessage',
  description: 'Initializes a user, conversation and sends a message to the conversation (optional).',
  method: 'post',
  path: '/initialize-incoming-message',
  requestBody: {
    description: 'User, conversation and optional message data.',
    schema: initializeBodySchema,
  },
  parameters: {
    'x-user-key': { ...authHeaders['x-user-key'], required: false },
  },
  section: 'message',
  response: {
    description: 'Returns the user, conversation and message if sent',
    schema: schema(
      z.object({
        user: userSchema.extend({ key: z.string() }),
        conversation: api.getModelRef('Conversation'),
        message: api.getModelRef('Message').optional(),
      })
    ),
  },
  tags: ['experimental'],
})
