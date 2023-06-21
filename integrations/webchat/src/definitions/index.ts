import { IntegrationDefinitionProps, messages } from '@botpress/sdk'
import { z } from 'zod'

export { actions } from './actions'
export { events } from './events'

export const configuration = {
  schema: z.object({
    messagingUrl: z.string(),
    clientId: z.string().uuid(),
    clientToken: z.string(),
    adminKey: z.string(),
  }),
} satisfies IntegrationDefinitionProps['configuration']

export const states = {
  webchatintegration: {
    type: 'integration',
    schema: z.object({
      webhookToken: z.string(),
      webhook: z.object({
        token: z.string(),
      }),
    }),
  },
  userData: {
    type: 'user',
    schema: z.object({}).passthrough(),
  },
} satisfies IntegrationDefinitionProps['states']

export const user = {
  tags: {
    id: {},
  },
} satisfies IntegrationDefinitionProps['user']

const messagesWithClassnames = Object.fromEntries(
  Object.entries(messages.defaults).map(([type, def]) => {
    const schema = def.schema.extend({
      className: z.string().describe('CSS className to apply to the message').optional(),
    })
    return [
      type,
      {
        ...def,
        schema,
      },
    ]
  })
)

export const channels = {
  channel: {
    messages: messagesWithClassnames,
    message: {
      tags: {
        id: {},
      },
    },
    conversation: {
      tags: {
        id: {},
      },
    },
  },
} satisfies IntegrationDefinitionProps['channels']
