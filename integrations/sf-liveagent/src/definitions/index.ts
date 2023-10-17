import type { IntegrationDefinitionProps } from '@botpress/sdk'
import { z } from 'zod'
import { LiveAgentSessionSchema, SFLiveagentConfigSchema } from './schemas'

export { actions } from './actions'
export { events } from './events'
export { channels } from './channels'

export const configuration = {
  schema: SFLiveagentConfigSchema,
} satisfies IntegrationDefinitionProps['configuration']

export const states = {
  pollingMs: {
    type: 'integration',
    schema: z.object({
      webhookUrl: z.string()
    }),
  },
  liveAgentSession: {
    type: 'conversation',
    schema: LiveAgentSessionSchema,
  }
} satisfies IntegrationDefinitionProps['states']

export const user = {
  tags: {
    pollingKey: z.string(),
  },
  creation: { enabled: true, requiredTags: [ 'pollingKey' ] },
} satisfies IntegrationDefinitionProps['user']
