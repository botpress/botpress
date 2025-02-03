import { IntegrationDefinition } from '@botpress/sdk'
import { actions, configuration, entities, secrets } from './definitions'

export default new IntegrationDefinition({
  name: 'dropbox',
  title: 'Dropbox',
  version: '0.1.0',
  description: 'Manage your files and folders effortlessly.',
  readme: 'hub.md',
  icon: 'icon.svg',
  configuration,
  actions,
  entities,
  secrets,
})
