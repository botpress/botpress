import { IntegrationDefinition, z } from '@botpress/sdk'

export default new IntegrationDefinition({
  name: 'loops',
  title: 'Loops',
  description: 'Handle transactional emails from your chatbot.',
  version: '0.1.0',
  readme: 'hub.md',
  icon: 'icon.svg',
  configuration: {
    schema: z.object({
      apiKey: z.string().title('Loops API Key').describe('Your Loops API Key'),
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
          dataVariables: z
            .array(z.object({ key: z.string(), value: z.string() }))
            .describe(
              'An object containing data as defined by the data variables added to the transactional email template.'
            ),
          addToAudience: z
            .boolean()
            .optional()
            .describe(
              'If true, a contact will be created in your audience using the email value (if a matching contact doesn’t already exist).'
            ),
          idempotencyKey: z
            .string()
            .optional()
            .describe(
              'Optionally send an idempotency key to avoid duplicate requests. The value should be a string of up to 100 characters and should be unique for each request. We recommend using V4 UUIDs or some other method with enough guaranteed entropy to avoid collisions during a 24 hour window. The endpoint will return a 409 Conflict response if the idempotency key has been used in the previous 24 hours.'
            ),
        }),
      },
      output: {
        schema: z.object({}),
      },
    },
  },
})
