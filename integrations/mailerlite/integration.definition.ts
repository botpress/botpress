import { IntegrationDefinition, z } from '@botpress/sdk'
import { integrationName } from './package.json'
import { actions, events, states } from './definitions'

export default new IntegrationDefinition({
  name: integrationName,
  version: '0.1.0',
  readme: 'hub.md',
  icon: 'icon.svg',

  configuration: {
    schema: z.object({
      APIKey : z.string()
        .title("API Key").
        describe("Developer API token").
        min(1).
        secret()
    }).required()
  },
  
  actions,
  events,
  states,
})
