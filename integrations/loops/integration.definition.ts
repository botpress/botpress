import { IntegrationDefinition, z } from '@botpress/sdk'
import { sendTransactionalEmailInputSchema, sendTransactionalEmailOutputSchema } from 'definitions/actions'

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
      input: { schema: sendTransactionalEmailInputSchema },
      output: { schema: sendTransactionalEmailOutputSchema },
    },
  },
})
