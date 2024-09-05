import { z, IntegrationDefinitionProps } from '@botpress/sdk'

export const states = {
  credentials: {
    type: 'integration',
    schema: z.object({
      accessToken: z.string(),
      expiresAt: z.string(),
    }),
  },
} satisfies IntegrationDefinitionProps['states']
