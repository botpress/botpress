import sdk, { z } from '@botpress/sdk'

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
  configuration: {
    type: 'integration',
    schema: z.object({
      calendarId: z
        .string()
        .title('Calendar ID')
        .min(1)
        .describe('The Google Calendar ID collected via the setup wizard'),
    }),
  },
} as const satisfies sdk.IntegrationDefinitionProps['states']
