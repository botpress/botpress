import { z, IntegrationDefinition } from '@botpress/sdk'
import { sendEmailOutputSchema, sendMailInputSchema } from './definitions/actions'

export default new IntegrationDefinition({
  name: 'sendgrid',
  title: 'SendGrid',
  version: '0.1.0',
  readme: 'hub.md',
  icon: 'icon.svg',
  description: 'Send markdown rich-text emails using the SendGrid email service.',
  configuration: {
    schema: z.object({
      apiKey: z.string().secret().min(1).describe('Your SendGrid API Key').title('SendGrid API Key'),
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
