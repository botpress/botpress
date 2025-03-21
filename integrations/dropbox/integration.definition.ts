import { IntegrationDefinition } from '@botpress/sdk'
import filesReadonly from './bp_modules/files-readonly'
import { actions, configuration, entities, secrets } from './definitions'

export default new IntegrationDefinition({
  name: 'dropbox',
  title: 'Dropbox',
  version: '0.2.0',
  description: 'Manage your files and folders effortlessly.',
  readme: 'hub.md',
  icon: 'icon.svg',
  configuration,
  actions,
  entities,
  secrets,
}).extend(filesReadonly, ({}) => ({
  entities: {},
  actions: {
    listItemsInFolder: { name: 'filesReadonlyListItemsInFolder' },
    transferFileToBotpress: { name: 'filesReadonlyTransferFileToBotpress' },
  },
}))
