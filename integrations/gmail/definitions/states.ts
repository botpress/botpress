import * as sdk from '@botpress/sdk'
const { z } = sdk

export const states = {
  thread: {
    type: 'conversation',
    schema: z.object({
      inReplyTo: z.string(),
    }),
  },
  configuration: {
    type: 'integration',
    schema: z.object({
      refreshToken: z.string(),
      lastHistoryId: z.string().optional(),
    }),
  },
} as const satisfies sdk.IntegrationDefinitionProps['states']
