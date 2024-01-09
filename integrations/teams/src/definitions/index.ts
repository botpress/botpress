import { IntegrationDefinitionProps, messages } from '@botpress/sdk'
import { z } from 'zod'

export { states } from './states'

export const configuration = {
  schema: z.object({
    appId: z.string(),
    appPassword: z.string(),
    tenantId: z.string().optional(),
  }),
} satisfies IntegrationDefinitionProps['configuration']

export const channels = {
  channel: {
    messages: messages.defaults,
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

export const user = {
  tags: {
    id: {},
  },
} satisfies IntegrationDefinitionProps['user']
