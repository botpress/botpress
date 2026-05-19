import { IntegrationDefinition } from '@botpress/sdk'
import { actions, configuration, states } from './definitions/index'

export default new IntegrationDefinition({
  name: 'plus/sharepoint',
  version: '4.1.0',
  title: 'SharePoint',
  description: 'Sync one or many SharePoint document libraries with one or more Botpress knowledge bases.',
  readme: 'hub.md',
  icon: 'icon.svg',
  configuration,
  states,
  actions,
})
