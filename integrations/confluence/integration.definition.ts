import { IntegrationDefinition, z } from '@botpress/sdk'
import filesReadonly from './bp_modules/files-readonly'

import { actions } from './definitions'

export default new IntegrationDefinition({
  name: 'confluence',
  version: '0.1.0',
  readme: 'hub.md',
  icon: 'icon.svg',
  title: 'Confluence',
  description: 'Manage your files and folders effortlessly.',
  configuration: {
    schema: z.object({
      host: z.string().describe('Host URI. Format is https://your_workspace_name.atlassian.net').title('Host'),
      user: z.string().describe('Email of the user').title('User Email'),
      apiToken: z.string().describe('API Token').title('API Token'),
    }),
  },
  actions,
}).extend(filesReadonly, ({}) => ({
  entities: {},
  actions: {
    listItemsInFolder: { name: 'filesReadonlyListItemsInFolder' },
    transferFileToBotpress: { name: 'filesReadonlyTransferFileToBotpress' },
  },
}))
