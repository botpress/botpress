import type { IntegrationDefinitionProps } from '@botpress/sdk'
import { z } from '@botpress/sdk'
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
