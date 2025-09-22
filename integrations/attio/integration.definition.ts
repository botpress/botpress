import { IntegrationDefinition, z } from '@botpress/sdk'
import { actions } from './definitions'

export default new IntegrationDefinition({
  name: 'attio',
  version: '0.1.0',
  title: 'Attio',
  readme: 'hub.md',
  icon: 'icon.svg',
  description: 'Interact with Attio from your chatbot',
  configuration: {
    schema: z.object({
      accessToken: z.string().title('Access Token').describe('The Access token of the Attio integration'),
      webhook: z
        .object({
          secret: z.string().title('Webhook Secret').describe('The Webhook secret of the Attio integration'),
          url: z.string().title('Webhook URL').describe('The Webhook URL of the Attio integration'),
        })
        .optional()
        .title('Webhook')
        .describe('The Webhook of the Attio integration'),
    }),
  },
  actions,
})
