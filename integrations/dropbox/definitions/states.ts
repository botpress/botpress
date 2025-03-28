import * as sdk from '@botpress/sdk'

export const states = {
  authorization: {
    type: 'integration',
    schema: sdk.z.object({
      refreshToken: sdk.z.string().describe('Refresh token used to generate a new access token').secret(),
      grantedScopes: sdk.z.array(sdk.z.string()).describe('Scopes granted by the user'),
      accountId: sdk.z.string().describe('User ID of the authenticated user'),
      authorizationCode: sdk.z
        .string()
        .title('Access Code')
        .describe('The Access Code that was exchanged for the refresh token')
        .secret(),
    }),
  },
} as const satisfies sdk.IntegrationDefinitionProps['states']
