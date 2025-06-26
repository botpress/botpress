import { IntegrationDefinition, z } from '@botpress/sdk'
import { sendEmailOutputSchema, sendMailInputSchema } from './definitions/actions'

export default new IntegrationDefinition({
  name: 'resend',
  title: 'Resend',
  version: '0.0.1',
  readme: 'hub.md',
  icon: 'icon.svg',
  description: 'Send markdown rich-text emails using the Resend email service.',
  configuration: {
    schema: z.object({
      apiKey: z.string().secret().min(1).describe('Your Resend API Key').title('Resend API Key'),
    }),
  },
  actions: {
    sendMail: {
      title: 'Send Email',
      description: 'Sends an email to the specified email address',
      input: {
        schema: sendMailInputSchema,
      },
      output: {
        schema: sendEmailOutputSchema,
      },
    },
  },
})
