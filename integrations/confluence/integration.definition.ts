import { IntegrationDefinition, z } from '@botpress/sdk'
import filesReadonly from './bp_modules/files-readonly'

import { actions, channels } from './definitions'

export default new IntegrationDefinition({
  name: 'confluence',
  version: '0.0.2',
  readme: 'hub.md',
  icon: 'icon.svg',
  title: 'Confluence',
  description: 'Confluence integration for Botpress',
  configuration: {
    schema: z.object({
      host: z.string().describe('Host URI. Format is https://your_workspace_name.atlassian.net').title('Host'),
      user: z.string().describe('Email of the user').title('User Email'),
      apiToken: z.string().describe('API Token').title('API Token'),
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
