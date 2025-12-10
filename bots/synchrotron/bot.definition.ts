/* bplint-disable */ // zui `toTypescriptSchema` does not preserve title and description properties
import * as sdk from '@botpress/sdk'
import * as genenv from './.genenv'
import chat from './bp_modules/chat'
import dropbox from './bp_modules/dropbox'
import fileSynchronizer from './bp_modules/file-synchronizer'

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
  .addIntegration(dropbox, {
    enabled: true,
    configuration: {
      clientId: genenv.FILESYNC_DROPBOX_CLIENT_ID,
      clientSecret: genenv.FILESYNC_DROPBOX_CLIENT_SECRET,
      authorizationCode: genenv.FILESYNC_DROPBOX_AUTHORIZATION_CODE,
    },
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
        integrationAlias: 'dropbox',
        integrationInterfaceAlias: 'files-readonly',
      },
    },
  })
