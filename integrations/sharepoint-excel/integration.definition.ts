import { IntegrationDefinition } from '@botpress/sdk'
import { configuration, states, actions } from './src/definitions/index'

export default new IntegrationDefinition({
  name: 'sharepoint-excel',
  title: 'SharePoint Excel',
  version: '0.1.0',
  readme: 'hub.md',
  icon: 'icon.svg',
  description: 'Sync Excel sheets from a SharePoint document library into Botpress tables',
  configuration,
  actions: {
    syncExcelFile: actions.syncExcelFile,
  },
  states,
  attributes: {
    category: 'File Management',
    repo: 'botpress',
  },
})
