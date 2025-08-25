import { IntegrationDefinition, z } from '@botpress/sdk'

export default new IntegrationDefinition({
  name: 'docusign',
  title: 'Docusign',
  version: '0.0.1',
  readme: 'hub.md',
  icon: 'icon.svg',
  description:
    'Automate document workflows, generate intelligent insights, enhance security measures, and improve user experience.',
  actions: {
    sendReminder: {
      title: 'Send Reminder',
      description: 'Sends a reminder to for the recipient of a document to sign it',
      input: {
        schema: z.object({}),
      },
      output: {
        schema: z.object({}),
      },
    },
  },
})
