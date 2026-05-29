import { IntegrationDefinition, z } from '@botpress/sdk'
import { configurationSchema, createItemSchema, manualConfigurationSchema } from 'src/misc/custom-schemas'

export default new IntegrationDefinition({
  name: 'monday',
  title: 'Monday',
  description: 'Manage items in Monday boards.',
  version: '1.1.5',
  readme: 'hub.md',
  icon: 'icon.svg',
  states: {
    oAuthCredentials: {
      type: 'integration',
      schema: z.object({
        accessToken: z.string().secret().title('Access Token').describe('The Monday OAuth access token.'),
      }),
    },
  },
  actions: {
    createItem: {
      title: 'Create Item',
      description: 'Create a new item.',
      input: { schema: createItemSchema },
      output: {
        schema: z.object({}),
      },
    },
  },
  configuration: {
    schema: configurationSchema,
    identifier: {
      linkTemplateScript: 'linkTemplate.vrl',
    },
  },
  configurations: {
    manual: {
      title: 'Manual Configuration',
      description: 'Configure with your Personal Access Token',
      schema: manualConfigurationSchema,
    },
  },
  secrets: {
    CLIENT_ID: {
      description: 'The client ID of the OAuth app.',
    },
    CLIENT_SECRET: {
      description: 'The client secret of the OAuth app.',
    },
  },
  attributes: {
    category: 'Project Management',
    repo: 'botpress',
  },
})
