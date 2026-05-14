import { z } from '@botpress/sdk'
import { ActionDef } from './types'

export const createContactPoint = {
  title: 'Create Contact Point',
  description: 'Create a Grafana webhook contact point pointing at the bot webhook URL',
  input: {
    schema: z.object({
      webhookUrl: z.string().optional().describe('Defaults to the bot webhook URL saved at registration'),
      name: z.string().optional().default('BotpressWebhook').describe('Contact point name'),
    }),
  },
  output: {
    schema: z.object({
      success: z.boolean(),
      uid: z.string().optional(),
      error: z.string().optional(),
    }),
  },
} satisfies ActionDef
