import { z, StateDefinition } from '@botpress/sdk'

const mailerLiteIntegrationInfo = {
  type: 'integration' as const,
  schema: z.object({
    mailerLiteWebhookId: z
      .string()
      .title('MailerLite Webhook ID')
      .describe('ID of the webhook created in MailerLite for this integration'),
  }),
}

export const states = {
  mailerLiteIntegrationInfo,
} as const satisfies Record<string, StateDefinition>
