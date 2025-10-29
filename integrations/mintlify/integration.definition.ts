/* bplint-disable */
import { z, IntegrationDefinition } from '@botpress/sdk'
import { actions } from './definitions'

export default new IntegrationDefinition({
  name: 'mintlify',
  title: 'Mintlify',
  description: 'Create and retrieve agent jobs in your Mintlify documentation',
  version: '1.0.0',
  readme: 'hub.md',
  icon: 'icon.svg',
  configuration: {
    schema: z.object({
      apiKey: z.string().title('API key').describe('Your Mintlify API key'),
      projectId: z.string().title('Project ID').describe('Your Mintlify project ID'),
    }),
  },
  actions,
})
