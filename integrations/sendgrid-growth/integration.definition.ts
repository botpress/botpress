import { IntegrationDefinition, z } from '@botpress/sdk'
import { integrationName } from './package.json'

export default new IntegrationDefinition({
  name: integrationName,
  title: 'SendGrid',
  description: 'This integration allows you to send emails with SendGrid.',
  version: '1.0.0',
  readme: 'hub.md',
  icon: 'icon.svg',
  configuration: {
    schema: z.object({
      apiKey: z.string().describe('The SendGrid API key.'),
    }),
  },
  channels: {},
  actions: {
    sendEmail: {
      title: 'Send Email',
      description: 'Send an email with SendGrid',
      input: { 
        schema: z.object({
          from: z.string().email().describe('The email address to send the email from.'),
          to: z.string().describe('Accepts a single email address or stringified array of email addresses.'),
          subject: z.string().describe('The subject of the email.'),
          content: z.string().describe('The content of the email.'),
        }),
      },
      output: {
        schema: z.object({}),
      },
    }
  },
})
