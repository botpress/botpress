import { IntegrationDefinitionProps } from '@botpress/sdk'
import { z } from 'zod'

export { actions } from './actions'
export { events } from './events'
export { channels } from './channels'

export const configuration = {
  identifier: {
    linkTemplateScript: 'linkTemplate.vrl',
  },
  schema: z.object({
    botToken: z.string().optional(), // TODO revert once the multiple configuration is available
    signingSecret: z.string().optional(), // TODO revert once the multiple configuration is available
  }),
} satisfies IntegrationDefinitionProps['configuration']

export const states = {
  configuration: {
    type: 'integration',
    schema: z.object({
      botUserId: z.string().optional(),
    }),
  },
  credentials: {
    type: 'integration',
    schema: z.object({
      accessToken: z.string(),
    }),
  },
} satisfies IntegrationDefinitionProps['states']

export const user = {
  tags: { id: {} },
  creation: { enabled: true, requiredTags: ['id'] },
} satisfies IntegrationDefinitionProps['user']
