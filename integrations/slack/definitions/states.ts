import * as sdk from '@botpress/sdk'

export const states = {
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

  /** @deprecated - Remove this once we're confident nobody has long-lived access tokens anymore */
  credentials: {
    type: 'integration',
    schema: sdk.z.object({
      accessToken: sdk.z.string().secret().title('Long-lived access token').describe('The Bot User OAuth Token'),
      signingSecret: sdk.z.string().secret().title('Unused signing secret').describe('The Slack Signing Secret'),
    }),
  },

  oAuthCredentialsV2: {
    type: 'integration',
    schema: sdk.z.object({
      shortLivedAccessToken: sdk.z
        .object({
          currentAccessToken: sdk.z.string().secret().describe('The Bot User OAuth Access Token'),
          issuedAt: sdk.z.string().datetime().describe('The timestamp of when the access token was issued'),
          expiresAt: sdk.z.string().datetime().describe('The timestamp of when the access token expires'),
        })
        .title('Short-lived access token')
        .describe('Access token that expires after 12 hours'),
      rotatingRefreshToken: sdk.z
        .object({
          token: sdk.z.string().secret().describe('The Bot User OAuth Refresh Token'),
          issuedAt: sdk.z.string().datetime().describe('The timestamp of when the refresh token was issued'),
        })
        .title('Rotating refresh token')
        .describe('Refresh token that does not expire but can be used only once to get a new access token'),
      grantedScopes: sdk.z.array(sdk.z.string()).title('Scopes').describe('The scopes granted to the token'),
      botUserId: sdk.z.string().title('Slack bot user').describe('The ID of the Slack bot user'),
      teamId: sdk.z.string().title('Slack workspace').describe('The ID of the Slack team'),
      // Allows re-registering the integration with a revoked refresh token if it hasn't changed:
      originalRefreshToken: sdk.z
        .string()
        .optional()
        .title('Original refresh token')
        .describe('The now-revoked refresh token that was used to set up the integration'),
    }),
  },
} as const satisfies sdk.IntegrationDefinitionProps['states']
