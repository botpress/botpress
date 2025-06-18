import { z, IntegrationDefinition } from '@botpress/sdk'
import { integrationName } from './package.json'
import { sendEmailOutputSchema, sendMailInputSchema } from './src/misc/custom-schemas'

export default new IntegrationDefinition({
  name: integrationName,
  title: 'SendGrid',
  version: '0.0.1',
  readme: 'hub.md',
  icon: 'icon.svg',
  description: 'Send simple plain text emails using the SendGrid email service.',
  configuration: {
    schema: z.object({
      apiKey: z.string().min(1).describe('Your SendGrid API Key').title('SendGrid API Key'),
    }),
  },
  actions: {
    sendMail: {
      title: 'Send Email',
      description: 'Sends an email to the specified client',
      input: {
        schema: sendMailInputSchema,
      },
      output: {
        schema: sendEmailOutputSchema,
      },
    },
  },
})
