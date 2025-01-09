import { IntegrationDefinition } from '@botpress/sdk'
import { actions, configuration } from './definitions'
import { integrationName } from './package.json'

export default new IntegrationDefinition({
  name: integrationName,
  version: '0.0.1',
  readme: 'hub.md',
  icon: 'icon.svg',
  configuration,
  actions,
})
