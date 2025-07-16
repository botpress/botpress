import * as sdk from '@botpress/sdk'
import filesReadonly from './bp_modules/files-readonly'
import { actions, configuration, entities, secrets, states } from './definitions'

export default new sdk.IntegrationDefinition({
  name: 'dropbox',
  title: 'Dropbox',
  version: '1.2.0',
  description: 'Manage your files and folders effortlessly.',
  readme: 'hub.md',
  icon: 'icon.svg',
  configuration,
  actions,
  entities,
  secrets,
  states,
}).extend(filesReadonly, ({}) => ({
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
