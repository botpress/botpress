import * as sdk from '@botpress/sdk'
const { z } = sdk

export const states = {
  oAuthConfig: {
    type: 'integration',
    schema: z.object({
      refreshToken: z
        .string()
        .title('Refresh token')
        .describe('The refresh token to use to authenticate with Google APIs. It gets exchanged for a bearer token'),
    }),
  },
} as const satisfies sdk.IntegrationDefinitionProps['states']
