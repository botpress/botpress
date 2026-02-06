import * as sdk from '@botpress/sdk'

export const states = {
  credentials: {
    type: 'integration',
    schema: sdk.z.object({
      accessCode: sdk.z.string().optional().title('Access token').describe('The access token obtained by OAuth'),
      subdomain: sdk.z.string().optional().title('Subdomain').describe('The bot subdomain'),
    }),
  },
  authorization: {
    type: 'integration',
    schema: sdk.z.object({
      refreshToken: sdk.z
        .string()
        .title('Refresh Token')
        .describe('Refresh token used to generate a new access token')
        .secret(),
      grantedScopes: sdk.z.array(sdk.z.string()).title('Granted Scopes').describe('Scopes granted by the user'),
      accountId: sdk.z.string().title('Account ID').describe('User ID of the authenticated user'),
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
