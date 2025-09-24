import { z, StateDefinition } from '@botpress/sdk'

const attioIntegrationInfo: StateDefinition = {
  type: 'integration',
  schema: z.object({
    attioWebhookId: z
      .string()
      .nullable()
      .title('Attio Webhook ID')
      .describe('ID of the webhook created in Attio for this integration'),
  }),
}

export const states = {
  attioIntegrationInfo,
}
