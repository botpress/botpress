import * as sdk from '@botpress/sdk'
const { z } = sdk

export const states = {
  thread: {
    type: 'conversation',
    schema: z.object({
      inReplyTo: z
        .string()
        .title('In reply to')
        .optional()
        .describe('The ID of the message this message is a reply to'),
    }),
  },
  configuration: {
    type: 'integration',
    schema: z.object({
      refreshToken: z
        .string()
        .title('Refresh token')
        .describe('The refresh token to use to authenticate with Gmail. It gets exchanged for a bearer token'),
      lastHistoryId: z
        .string()
        .optional()
        .title('History cursor')
        .describe('The last history ID processed by the integration'),
      authorizationCode: z
        .string()
        .optional()
        .title('Used authorization code')
        .describe('The authorization code already exchanged for the refresh token, so it is not exchanged again'),
    }),
  },
  watch: {
    type: 'integration',
    schema: z.object({
      expiresAtMs: z
        .number()
        .title('Watch expiry')
        .describe('When Gmail stops sending notifications for the current watch (epoch milliseconds)'),
    }),
  },
  registerSchedule: {
    type: 'integration',
    schema: z.object({
      status: z
        .enum(['pending', 'scheduled', 'failed'])
        .title('Status')
        .describe('Whether the daily register() call is being requested, was scheduled, or failed to schedule'),
      updatedAtMs: z.number().title('Updated at').describe('When the status last changed (epoch milliseconds)'),
    }),
  },
  googlePublicCertCache: {
    type: 'integration',
    schema: z.object({
      certificates: z
        .string()
        .title('Certificates JSON')
        .describe('The certs used by Google for federated sign-on, stringified as JSON'),
    }),
  },
} as const satisfies sdk.IntegrationDefinitionProps['states']
