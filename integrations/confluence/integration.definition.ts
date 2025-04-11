import { IntegrationDefinition } from '@botpress/sdk'
import filesReadonly from './bp_modules/files-readonly'

import { actions, channels, secrets } from './definitions'
import { integrationName } from './package.json'

export default new IntegrationDefinition({
  name: integrationName,
  version: '0.0.1',
  readme: 'hub.md',
  icon: 'icon.svg',
  actions,
  channels,
  secrets,
}).extend(filesReadonly, ({}) => ({
  entities: {},
  actions: {
    listItemsInFolder: { name: 'filesReadonlyListItemsInFolder' },
    transferFileToBotpress: { name: 'filesReadonlyTransferFileToBotpress' },
  },
}))
