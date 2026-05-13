import { z, IntegrationDefinitionProps } from '@botpress/sdk'
import { userProfileSchema } from './schemas'

export const states = {
  credentials: {
    type: 'integration',
    schema: z.object({
      accessToken: z.string().title('Access Token').describe('The access token for Linear'),
      refreshToken: z
        .string()
        .title('Refresh Token')
        .describe('The refresh token needed when the access token expires'),
      expiresAt: z.string().title('Expires At').describe('The time when the access token expires'),
    }),
  },
  environment: {
    type: 'integration',
    schema: z.object({
      env: z
        .enum(['preview', 'production'])
        .title('Environment')
        .describe('The environment where the integration is installed'),
      source: z.string().optional().title('Source').describe('The source of the OAuth request, eg: "desk"'),
    }),
  },

  // TODO: delete these 2 states when the backend stop considering state deletion as breaking change
  configuration: {
    type: 'integration',
    schema: z.object({
      botUserId: z.string().optional().title('Bot User ID').describe('The ID of the bot user'),
    }),
  },
  profile: {
    type: 'user',
    schema: userProfileSchema,
  },
} satisfies IntegrationDefinitionProps['states']
