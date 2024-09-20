import { z, IntegrationDefinitionProps } from '@botpress/sdk'

export { actions } from './actions'
export { events } from './events'
export { channels } from './channels'

export const configuration = {
  schema: z.object({
    owner: z.string().min(1),
    repo: z.string().min(1),
    token: z.string().min(1),
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
