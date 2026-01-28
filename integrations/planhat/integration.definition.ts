import { z, IntegrationDefinition } from '@botpress/sdk'
import { integrationName } from './package.json'

export default new IntegrationDefinition({
  name: integrationName,
  version: '0.1.0',
  readme: 'hub.md',
  icon: 'icon.svg',
  configuration: {
    schema: z.object({
      apiToken: z.string().secret().min(1).describe('Your Planhat API Token').title('API Token'),
    }),
  },
  actions: {
    helloWorld: {
      title: 'Hello World',
      description: 'A simple hello world action',
      input: {
        schema: z.object({
          name: z.string().optional(),
        }),
      },
      output: {
        schema: z.object({
          message: z.string(),
        }),
      },
    },
  },
})
