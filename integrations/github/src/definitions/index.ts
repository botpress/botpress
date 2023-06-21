import { IntegrationDefinitionProps } from '@botpress/sdk'
import { z } from 'zod'

export { actions } from './actions'
export { events } from './events'
export { channels } from './channels'

export const configuration = {
  schema: z.object({
    owner: z.string(),
    repo: z.string(),
    token: z.string(),
  }),
} satisfies IntegrationDefinitionProps['configuration']

export const user = {
  tags: {
    id: {},
  },
} satisfies IntegrationDefinitionProps['user']

export const states = {
  configuration: {
    type: 'integration',
    schema: z.object({
      webhookSecret: z.string().optional(),
      webhookId: z.number().optional(),
      botUserId: z.number().optional(),
    }),
  },
} satisfies IntegrationDefinitionProps['states']
