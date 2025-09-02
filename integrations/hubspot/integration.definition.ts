import { IntegrationDefinition, z } from '@botpress/sdk'

export default new IntegrationDefinition({
  name: 'hubspot',
  title: 'Hubspot',
  description: 'Manage contacts, tickets and more from your chatbot.',
  version: '0.0.1',
  readme: 'hub.md',
  icon: 'icon.svg',
  // TODO: Implement OAuth
  configuration: {
    schema: z.object({}),
  },
  configurations: {
    manual: {
      title: 'Manual Configuration',
      description: 'Manual configuration, use your own Hubspot app',
      schema: z.object({
        accessToken: z.string().min(1).title('Access Token').describe('Your Hubspot Access Token'),
      }),
    },
  },
  events: {
    contactCreated: {
      title: 'Contact Created',
      description: 'A new contact has been created in Hubspot.',
      schema: z.object({}),
    },
    contactUpdated: {
      title: 'Contact Updated',
      description: 'A contact has been updated in Hubspot.',
      schema: z.object({}),
    },
  },
})
