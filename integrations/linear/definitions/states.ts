import { z, IntegrationDefinitionProps } from '@botpress/sdk'
import { userProfileSchema } from './schemas'

const oauthCredentialsSchema = z.object({
  accessToken: z.string().title('Access Token').describe('The access token for Linear'),
  refreshToken: z.string().title('Refresh Token').describe('The refresh token needed when the access token expires'),
  expiresAt: z.string().title('Expires At').describe('The time when the access token expires'),
})

export const states = {
  credentials: {
    type: 'integration',
    schema: oauthCredentialsSchema,
  },
  adminCredentials: {
    type: 'integration',
    schema: oauthCredentialsSchema.describe(
      'User-actor OAuth credentials used only for admin operations (webhook register/unregister)'
    ),
  },
  environment: {
    type: 'integration',
    schema: z.object({
      env: z
        .enum(['preview', 'production'])
        .title('Environment')
        .describe('The environment where the integration is installed'),
      source: z.string().optional().title('Source').describe('The source of the OAuth request, eg: "desk"'),
      wizardPhase: z
        .enum(['admin', 'app'])
        .optional()
        .title('Wizard Phase')
        .describe('Which leg of the two-phase OAuth wizard is currently expected on /oauth callback'),
      runtimeActor: z
        .enum(['user', 'app'])
        .optional()
        .title('Runtime Actor')
        .describe('Which Linear OAuth actor type was used for the runtime credentials'),
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
