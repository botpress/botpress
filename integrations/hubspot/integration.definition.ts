import { IntegrationDefinition, z } from '@botpress/sdk'
import { actions, states, events } from './definitions'

export default new IntegrationDefinition({
  name: 'hubspot',
  title: 'HubSpot',
  description: 'Manage contacts, tickets and more from your chatbot.',
  version: '4.0.0',
  readme: 'hub.md',
  icon: 'icon.svg',
  configuration: {
    schema: z.object({}),
    identifier: {
      linkTemplateScript: 'linkTemplate.vrl',
    },
  },
  configurations: {
    manual: {
      title: 'Manual Configuration',
      description: 'Manual configuration, use your own Hubspot app',
      schema: z.object({
        accessToken: z.string().min(1).secret().title('Access Token').describe('Your Hubspot Access Token'),
        clientSecret: z
          .string()
          .secret()
          .optional()
          .title('Client Secret')
          .describe('Hubspot Client Secret (used for webhook signature check)'),
      }),
    },
  },
  identifier: {
    extractScript: 'extract.vrl',
  },
  actions,
  events,
  states,
  secrets: {
    CLIENT_ID: {
      description: 'The client ID of the Hubspot app',
    },
    CLIENT_SECRET: {
      description: 'The client secret of the Hubspot app',
    },
    DISABLE_OAUTH: {
      // TODO: Remove once the OAuth app allows for unlimited installs
      description: 'Whether to disable OAuth',
    },
  },
})
