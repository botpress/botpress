import * as sdk from '@botpress/sdk'

export const states = {
  configuration: {
    type: 'integration',
    schema: sdk.z.object({
      botUserId: sdk.z.string().optional().title('Bot User ID').describe('The ID of the bot user'),
    }),
  },

  sync: {
    type: 'integration',
    schema: sdk.z.object({
      usersLastSyncTs: sdk.z
        .number()
        .optional()
        .title('Users Last Sync Timestamp')
        .describe('The timestamp of the last sync'),
    }),
  },

  credentials: {
    type: 'integration',
    schema: sdk.z.object({
      accessToken: sdk.z.string().secret().describe('The Bot User OAuth Token'),
      signingSecret: sdk.z.string().secret().describe('The Slack Signing Secret'),
    }),
  },

  tokenMetadata: {
    type: 'integration',
    schema: sdk.z.object({
      scopes: sdk.z.array(sdk.z.string()).title('Scopes').describe('The scopes granted to the token'),
      lastRefresh: sdk.z.string().datetime().title('Last Refresh').describe('The timestamp of the last token refresh'),
    }),
  },
} as const satisfies sdk.IntegrationDefinitionProps['states']
