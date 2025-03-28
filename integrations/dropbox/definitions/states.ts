import * as sdk from '@botpress/sdk'

export const states = {
  authorization: {
    type: 'integration',
    schema: sdk.z.object({
      refreshToken: sdk.z.string().describe('Refresh token used to generate a new access token'),
      grantedScopes: sdk.z.array(sdk.z.string()).describe('Scopes granted by the user'),
      accountId: sdk.z.string().describe('User ID of the authenticated user'),
    }),
  },
} as const satisfies sdk.IntegrationDefinitionProps['states']
