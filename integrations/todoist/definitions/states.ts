import sdk, { z } from '@botpress/sdk'

export const states = {
 credentials: {
      type: 'integration',
      schema: z.object({
        accessToken: z.string(),
      }),
    },
    configuration: {
      type: 'integration',
      schema: z.object({
        botUserId: z.string().optional(),
      }),
    },
} as const satisfies sdk.IntegrationDefinitionProps['states']
