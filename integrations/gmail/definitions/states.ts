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
