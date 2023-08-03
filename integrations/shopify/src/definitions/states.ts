import { IntegrationDefinitionProps } from '@botpress/sdk'
import { z } from 'zod'

export const states = {
  configuration: {
    type: 'integration',
    schema: z.object({
      webhookId: z.string().optional(),
    }),
  },
} satisfies IntegrationDefinitionProps['states']
