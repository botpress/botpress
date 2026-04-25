import { z, IntegrationDefinitionProps } from '@botpress/sdk'

export const configuration = {
  schema: z.object({
    apiKey: z.string().min(1).describe('The Telnyx API key').title('API Key'),
    callControlApplicationId: z
      .string()
      .optional()
      .describe('The Call Control Application ID for voice calls')
      .title('Call Control Application ID'),
    messagingProfileId: z
      .string()
      .optional()
      .describe('The Messaging Profile ID for SMS')
      .title('Messaging Profile ID'),
    webhookUrl: z
      .string()
      .url()
      .optional()
      .describe('The webhook URL for receiving events')
      .title('Webhook URL'),
  }),
} satisfies IntegrationDefinitionProps['configuration']