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
  realTimeSync: {
    type: 'integration',
    schema: sdk.z.object({
      syncCursor: sdk.z
        .string()
        .title('Sync Cursor')
        .describe('The cursor used to track the sync state of the tracked Dropbox account.'),
      fileTreeJson: sdk.z.string().title('File Tree JSON').describe('The JSON representation of the file tree.'),
    }),
  },
  setupMeta: {
    type: 'integration',
    schema: sdk.z.object({
      integrationRegisteredAt: sdk.z
        .string()
        .datetime()
        .title('Registered At')
        .describe('Date and time when the user configured the integration'),
    }),
  },
} as const satisfies sdk.IntegrationDefinitionProps['states']
