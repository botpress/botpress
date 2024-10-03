import { z, IntegrationDefinitionProps } from '@botpress/sdk'
import { userProfileSchema } from './schemas'

export const states = {
  credentials: {
    type: 'integration',
    schema: z.object({
      accessToken: z.string().title('Access Token').describe('The access token for Linear'),
      expiresAt: z.string().title('Expires At').describe('The time when the access token expires'),
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
