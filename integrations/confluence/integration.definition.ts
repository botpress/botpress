import { IntegrationDefinition, z } from '@botpress/sdk'
import filesReadonly from './bp_modules/files-readonly'

import { actions, channels } from './definitions'

export default new IntegrationDefinition({
  name: 'confluence',
  version: '0.0.2',
  readme: 'hub.md',
  icon: 'icon.svg',
  configuration: {
    schema: z.object({
      host: z.string().describe('Host URI. Format is https://your_workspace_name.atlassian.net'),
      user: z.string().describe('Email of the user'),
      apiToken: z.string().describe('API Token'),
    }),
  },
  actions,
  channels,
}).extend(filesReadonly, ({}) => ({
  entities: {},
  actions: {
    listItemsInFolder: { name: 'filesReadonlyListItemsInFolder' },
    transferFileToBotpress: { name: 'filesReadonlyTransferFileToBotpress' },
  },
}))
