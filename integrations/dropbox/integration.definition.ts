import { IntegrationDefinition } from '@botpress/sdk'
import filesReadonly from './bp_modules/files-readonly'
import { actions, configuration, entities, secrets, states } from './definitions'

export default new IntegrationDefinition({
  name: 'dropbox',
  title: 'Dropbox',
  version: '1.0.0',
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
    listItemsInFolder: { name: 'filesReadonlyListItemsInFolder' },
    transferFileToBotpress: { name: 'filesReadonlyTransferFileToBotpress' },
  },
}))
