import { z, IntegrationDefinition } from '@botpress/sdk'
import { formFieldsSchema } from 'schemas/tally-events'

export default new IntegrationDefinition({
  name: 'tally',
  title: 'Tally',
  version: '0.1.0',
  readme: 'hub.md',
  icon: 'icon.svg',
  configuration: {
    schema: z.object({
      apiKey: z.string().min(1).title('API Key').describe('Tally API Key'),
      formId: z.string().min(1).title('Form ID').describe('Tally form ID'),
      signingSecret: z.string().min(1).optional().title('Signing Secret').describe('Webhook signing secret (optional)'),
    }),
  },
  states: {
    tallyIntegrationInfo: {
      type: 'integration',
      schema: z.object({
        tallyWebhookId: z.string().title('Tally Webhook ID').describe('The unique identifier for the tally webhook.'),
      }),
    },
  },
  events: {
    formSubmitted: {
      title: 'Form Submitted',
      description: 'This event happens when the form is submitted',
      schema: formFieldsSchema,
    },
  },
  actions: {},
})
