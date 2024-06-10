import { IntegrationDefinition, z } from '@botpress/sdk'
import { integrationName } from './package.json'

export default new IntegrationDefinition({
  name: integrationName,
  version: '0.0.1',
  readme: 'hub.md',
  icon: 'icon.svg',
  actions: {
    indexPage: {
      title: 'Index Page',
      description: 'Indexes a website page',
      input: {
        schema: z.object({
          pageUrl: z.string(),
        }),
      },
      output: {
        schema: z.object({}),
      },
    },
  },
})
