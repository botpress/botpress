import { IntegrationDefinition, z } from '@botpress/sdk'
import { actions, states, events } from './definitions'

export default new IntegrationDefinition({
  name: 'hubspot',
  title: 'HubSpot',
  description: 'Manage contacts, tickets and more from your chatbot.',
  version: '5.3.1',
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
      description:
        'Use your own HubSpot app. Enter your Client ID and Client Secret, then you will be redirected to authorize with HubSpot.',
      schema: z.object({
        clientId: z
          .string()
          .min(1)
          .title('Client ID')
          .describe('Your HubSpot app Client ID (found in app settings)'),
        clientSecret: z
          .string()
          .min(1)
          .secret()
          .title('Client Secret')
          .describe('Your HubSpot app Client Secret (found in app settings)'),
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
  __advanced: {
    useLegacyZuiTransformer: true,
  },
  attributes: {
    category: 'CRM & Sales',
  },
})
