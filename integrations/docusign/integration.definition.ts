import { IntegrationDefinition, z } from '@botpress/sdk'
import { sendReminderInputSchema, sendReminderOutputSchema } from 'definitions/actions'

export default new IntegrationDefinition({
  name: 'docusign',
  title: 'Docusign',
  version: '2.0.1',
  readme: 'hub.md',
  icon: 'icon.svg',
  description:
    'Automate document workflows, generate intelligent insights, enhance security measures, and improve user experience.',
  actions: {
    sendReminder: {
      title: 'Send Reminder',
      description: 'Sends a reminder to for the recipient of a document to sign it',
      input: {
        schema: sendReminderInputSchema,
      },
      output: {
        schema: sendReminderOutputSchema,
      },
    },
  },
})
