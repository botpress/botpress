import * as sdk from '@botpress/sdk'
const { z } = sdk

export const states = {
    webhookConfig: {
      type: 'integration' as const,
      schema: z.object({
        webhookUrl: z.string(),
      }),
    },
}
