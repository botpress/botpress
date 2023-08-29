import type { IntegrationDefinitionProps } from '@botpress/sdk'
import z from 'zod'

import { actions } from './actions'
import { channels } from './channels'

export { actions }
export { channels }

export const configuration = {
  schema: z.object({
    appId: z.string().describe('Identifies the app of Sunshine Conversations'),
    keyId: z.string().describe('API Key ID'),
    keySecret: z.string().describe('API Key Secret'),
  }),
}

export const states: IntegrationDefinitionProps['states'] = {
  zensunIntegrationInfo: {
    type: 'integration',
    schema: z.object({
      zensunIntegrationId: z.string(),
    }),
  },
}

export const user = {
  tags: { id: {} },
  creation: { enabled: true, requiredTags: ['id'] },
}
