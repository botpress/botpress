import { IntegrationDefinitionProps } from '@botpress/sdk'
import { z } from 'zod'

export const states = {
  configuration: {
    type: 'integration',
    schema: z.object({ webhookIds: z.array(z.string()).optional() }),
  },
} satisfies IntegrationDefinitionProps['states']
