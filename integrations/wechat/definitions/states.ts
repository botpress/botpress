import { type IntegrationDefinitionProps, z } from '@botpress/sdk'

export const states = {
  configuration: {
    type: 'integration',
    schema: z.object({
      auth: z
        .object({
          accessToken: z.string().title('Access Token').describe('The access token for the integration'),
          expiresAt: z
            .number()
            .min(0)
            .title('Expires At')
            .describe('The expiry time of the access token represented as a Unix timestamp (seconds)'),
        })
        .nullable()
        .default(null)
        .title('Auth Parameters')
        .describe('The parameters used for accessing the WeChat API'),
    }),
  },
} as const satisfies IntegrationDefinitionProps['states']
