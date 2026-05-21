import { IntegrationDefinition, z } from '@botpress/sdk'
import { configurationSchema, createItemSchema } from 'src/misc/custom-schemas'

export default new IntegrationDefinition({
  name: 'monday',
  title: 'Monday',
  description: 'Manage items in Monday boards.',
  version: '1.1.2',
  readme: 'hub.md',
  icon: 'icon.svg',
  states: {
    oAuthCredentials: {
      type: 'integration',
      schema: z.object({
        accessToken: z.string().secret().title('Access Token').describe('The Monday OAuth access token.'),
        tokenType: z.literal('Bearer').title('Token Type').describe('The Monday OAuth token type.'),
        scope: z.string().title('Scope').describe('The scopes granted to the Monday OAuth token.'),
      }),
    },
    configuration: {
      type: 'integration',
      schema: z.object({
        personalAccessToken: z
          .string()
          .secret()
          .title('Personal Access Token')
          .describe('The Monday.com personal access token used for manual configuration.'),
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
