import { z } from '@botpress/sdk'
import { ActionDef } from './types'

export const createContactPoint = {
  title: 'Create Contact Point',
  description: 'Create a Grafana webhook contact point pointing at the bot webhook URL',
  input: {
    schema: z.object({
      webhookUrl: z
        .string()
        .optional()
        .title('Webhook URL')
        .describe('Webhook URL to send alerts to. Defaults to the bot webhook URL saved at registration'),
      name: z
        .string()
        .optional()
        .default('BotpressWebhook')
        .title('Name')
        .describe('Contact point display name in Grafana'),
    }),
  },
  output: {
    schema: z.object({
      uid: z.string().title('UID').describe('UID of the created contact point'),
    }),
  },
} satisfies ActionDef
