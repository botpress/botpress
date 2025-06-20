/* bplint-disable */
import { z, IntegrationDefinition } from '@botpress/sdk'

export default new IntegrationDefinition({
  name: 'pipedrive',
  version: '0.0.1',
  readme: 'hub.md',
  icon: 'icon.svg',
  title: 'Pipedrive',
  description: 'Pipedrive integration for Botpress',
  configuration: {
    schema: z.object({
      apiKey: z.string().title('API Key').describe('Your Pipedrive API key.'),
    }),
  },
  actions: {
    createDeal: {
      title: 'createDeal',
      description: 'Create a new deal in Pipedrive.',
      input: {
        schema: z.object({
          title: z.string().title('Deal Title').describe('The title of the deal.'),
        }),
      },
      output: {
        schema: z.object({
          message: z.string().title('Response Message').describe('The response message from the Pipedrive API.'),
        }),
      },
    },
  },
  events: {
    leadCreated: {
      schema: z.object({}).passthrough(),
    },
    dealCreated: {
      schema: z.object({}).passthrough(),
    },
    leadChanged: {
      schema: z.object({}).passthrough(),
    },
    dealChanged: {
      schema: z.object({}).passthrough(),
    },
    dealDeleted: {
      schema: z.object({}).passthrough(),
    },
    leadDeleted: {
      schema: z.object({}).passthrough(),
    },
  },
})
