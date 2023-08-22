import type { IntegrationDefinitionProps } from '@botpress/sdk'
import { z } from 'zod'

export { actions } from './actions'
export { events } from './events'
export { channels } from './channels'

export const configuration = {
  schema: z.object({
    organizationSubdomain: z.string({
      description: 'Your zendesk organization subdomain. e.g. botpress7281',
    }),
    email: z.string({
      description: 'Your zendesk account email. e.g. john.doe@botpress.com',
    }),
    apiToken: z.string({
      description: 'Zendesk API Token',
    }),
  }),
} satisfies IntegrationDefinitionProps['configuration']

export const states = {
  subscriptionInfo: {
    type: 'integration',
    schema: z.object({
      subscriptionId: z.string(),
      triggerIds: z.array(z.string()),
    }),
  },
} satisfies IntegrationDefinitionProps['states']

export const user = {
  tags: {
    id: {},
    name: {},
    email: {},
    role: {},
  },
  creation: { enabled: true, requiredTags: [] },
} satisfies IntegrationDefinitionProps['user']
