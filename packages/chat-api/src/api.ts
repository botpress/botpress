import { state } from '@botpress/api'
import { OpenApi } from '@bpinternal/opapi'
import { conversationSchema } from './models/conversation'
import { eventSchema } from './models/event'
import { messageSchema } from './models/message'
import { userSchema } from './models/user'
import { apiVersion } from './version'

export const { errors } = state

export const sections = {
  user: { description: '', title: 'User' },
  conversation: { description: '', title: 'Conversation' },
  message: { description: '', title: 'Message' },
  event: { description: '', title: 'Event' },
} as const

export const parameters = {} as const

export const schemas = {
  User: { schema: userSchema, section: 'user' },
  Conversation: { schema: conversationSchema, section: 'conversation' },
  Message: { schema: messageSchema, section: 'message' },
  Event: { schema: eventSchema, section: 'event' },
} as const

export type Schemas = typeof schemas
export type Parameters = typeof parameters
export type Sections = typeof sections
export type ChatApi = OpenApi<keyof Schemas, keyof Parameters, keyof Sections>

export const chatApi = (): ChatApi =>
  OpenApi(
    {
      metadata: {
        title: 'Chat API',
        description: 'API for the Chat Integration',
        server: 'https://chat.botpress.cloud/',
        version: apiVersion,
      },
      sections,
      schemas,
      errors,
    },
    {
      allowUnions: true,
    }
  )
