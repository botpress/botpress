import { z, IntegrationDefinition } from '@botpress/sdk'
import schemas from './definitions/schemas'

export default new IntegrationDefinition({
  name: 'tally',
  title: 'Tally',
  description: 'Integrate with Tally forms to capture form submissions and automate workflows.',
  version: '0.1.1',
  readme: 'hub.md',
  icon: 'icon.svg',
  configuration: {
    schema: z.object({
      apiKey: z.string().min(1).title('API Key').describe('Tally API Key'),
      formIds: z.array(z.string().min(1)).min(1).title('Form IDs').describe('Tally form IDs'),
      signingSecret: z.string().min(1).optional().title('Signing Secret').describe('Webhook signing secret (optional)'),
    }),
  },
  states: {
    tallyIntegrationInfo: {
      type: 'integration',
      schema: z.object({
        tallyWebhookIds: z
          .record(z.string().min(1), z.string().min(1))
          .title('Tally webhooks')
          .describe('Mapping of Tally form IDs to their registered webhook IDs'),
      }),
    },
  },
  events: {
    formSubmitted: {
      title: 'Form Submitted',
      description: 'This event happens when the form is submitted',
      schema: schemas.formSchema,
    },
  },
  actions: {
    listSubmissions: {
      title: 'List Submissions',
      description: 'List all the submissions for a specified form',
      input: {
        schema: schemas.listSubmissionsInputSchema,
      },
      output: {
        schema: schemas.listSubmissionsOuputSchema,
      },
    },
  },
})
