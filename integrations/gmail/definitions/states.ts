import * as sdk from '@botpress/sdk'
const { z } = sdk

export const states = {
  thread: {
    type: 'conversation',
    schema: z.object({
      inReplyTo: z.string(),
    }),
  },
  configuration: {
    type: 'integration',
    schema: z.object({
      refreshToken: z.string(),
      lastHistoryId: z.string().optional(),
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
