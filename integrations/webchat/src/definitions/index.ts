import { IntegrationDefinitionProps } from '@botpress/sdk'
import { z } from 'zod'

export { actions } from './actions'
export { events } from './events'
export { channels } from './channels'

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
