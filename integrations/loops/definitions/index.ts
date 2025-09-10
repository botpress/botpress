import { ConfigurationDefinition, z } from '@botpress/sdk'

export { actions } from './actions'
export { events } from './events'

export const configuration = {
  schema: z.object({
    apiKey: z.string().title('API Key').describe('The API key for Loops'),
    webhookSigningSecret: z
      .string()
      .title('Webhook Signing Secret')
      .describe('The secret key for verifying incoming Loops webhook events. Must start with "whsec_".'),
  }),
} as const satisfies ConfigurationDefinition
