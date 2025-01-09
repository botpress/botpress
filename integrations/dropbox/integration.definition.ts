import { IntegrationDefinition } from '@botpress/sdk'
import { actions, configuration } from './definitions'

export default new IntegrationDefinition({
  name: 'dropbox',
  version: '0.0.1',
  readme: 'hub.md',
  icon: 'icon.svg',
  configuration,
  actions,
})
