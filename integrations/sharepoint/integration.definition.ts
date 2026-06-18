import * as sdk from '@botpress/sdk'
import filesReadonly from './bp_modules/files-readonly'
import { actions, configuration, states } from './definitions'

export default new sdk.IntegrationDefinition({
  name: 'sharepoint',
  version: '1.0.2',
  title: 'SharePoint',
  description: 'Sync SharePoint document libraries with Botpress knowledge bases.',
  readme: 'hub.md',
  icon: 'icon.svg',
  configuration,
  states,
  actions,
  attributes: {
    category: 'File Management',
    repo: 'botpress',
  },
}).extend(filesReadonly, ({}) => ({
  // Enables knowledge-connector plugin to browse and index SharePoint files
  entities: {},
  actions: {
    listItemsInFolder: {
      name: 'filesReadonlyListItemsInFolder',
      attributes: { ...sdk.WELL_KNOWN_ATTRIBUTES.HIDDEN_IN_STUDIO },
    },
    transferFileToBotpress: {
      name: 'filesReadonlyTransferFileToBotpress',
      attributes: { ...sdk.WELL_KNOWN_ATTRIBUTES.HIDDEN_IN_STUDIO },
    },
  },
}))
