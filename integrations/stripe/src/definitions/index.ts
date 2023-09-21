import type { IntegrationDefinitionProps } from '@botpress/sdk'
import z from 'zod'

import { actions } from './actions'
import { channels } from './channels'
import { events } from './events'

export { actions }
export { channels }
export { events }

export const configuration = {
  schema: z.object({
    apiKey: z.string().describe('API Key'),
    apiVersion: z
      .string()
      .optional()
      .default('2023-08-16')
      .describe('API Version (Optional) (Default: 2023-08-16)'),
  }),
}

export const states: IntegrationDefinitionProps['states'] = {
  stripeIntegrationInfo: {
    type: 'integration',
    schema: z.object({
      stripeWebhookId: z.string(),
    }),
  },
}

export const user = {
  tags: { id: {} },
  creation: { enabled: true, requiredTags: ['id'] },
}
