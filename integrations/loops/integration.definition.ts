import { IntegrationDefinition, z } from '@botpress/sdk'
import { integrationName } from './package.json'

export default new IntegrationDefinition({
  name: integrationName,
  version: '0.1.0',
  readme: 'hub.md',
  icon: 'icon.svg',
  configuration: {
    schema: z.object({
      apiKey: z.string().describe('Loops API Key'),
    }),
  },
  actions: {
    sendTransactionalEmail: {
      title: 'Send Transactional Email',
      description: 'Send a transactional email to a client',
      input: {
        schema: z.object({
          email: z.string().describe('The email address of the recipient.'),
          transactionalId: z.string().describe('The ID of the transactional email to send.'),
          dataVariables: z.array(z.object({ key: z.string(), value: z.union([z.string(), z.number()]) })).optional()
            .describe('An object containing data as defined by the data variables added to the transactional email template. Values can be of type string or number.'),
          addToAudience: z.boolean().optional()
            .describe('If true, a contact will be created in your audience using the email value (if a matching contact doesn’t already exist).'),
          idempotencyKey: z.string().optional()
            .describe('Optionally send an idempotency key to avoid duplicate requests. The value should be a string of up to 100 characters and should be unique for each request.'),
        }),
      },
      output: {
        schema: z.object({
          success: z.boolean().describe('Success'),
        }),
      },
    },
  }
})