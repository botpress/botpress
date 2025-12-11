/* bplint-disable */ // zui `toTypescriptSchema` does not preserve title and description properties
import * as sdk from '@botpress/sdk'
import * as genenv from './.genenv'
import chat from './bp_modules/chat'
import fileSynchronizer from './bp_modules/file-synchronizer'
import notion from './bp_modules/notion'

export default new sdk.BotDefinition({
  configuration: {
    schema: sdk.z.object({}),
  },
  states: {},
  events: {},
  recurringEvents: {},
  user: {},
  conversation: {},
})
  .addIntegration(chat, {
    enabled: true,
    configuration: {},
  })
  .addIntegration(notion, {
    enabled: true,
    configurationType: 'customApp',
    configuration: { authToken: genenv.NOTION_AUTH_TOKEN },
  })
  .addPlugin(fileSynchronizer, {
    configuration: {
      enableRealTimeSync: true,
      includeFiles: [
        {
          pathGlobPattern: '**',
        },
      ],
      excludeFiles: [],
    },
    dependencies: {
      'files-readonly': {
        integrationAlias: 'notion',
        integrationInterfaceAlias: 'files-readonly',
      },
    },
  })
