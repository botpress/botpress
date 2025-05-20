/* bplint-disable */ // zui `toTypescriptSchema` does not preserve title and description properties
import * as sdk from '@botpress/sdk'
import * as genenv from './.genenv'
import chat from './bp_modules/chat'
import dropbox from './bp_modules/dropbox'
import fileSynchronizer from './bp_modules/file-synchronizer'

const dropboxFilesReadonly = dropbox.definition.interfaces['files-readonly']

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
    interfaces: {
      'files-readonly': {
        id: dropbox.id,
        name: dropbox.name,
        version: dropbox.version,
        entities: dropboxFilesReadonly.entities,
        actions: dropboxFilesReadonly.actions,
        events: dropboxFilesReadonly.events,
        channels: dropboxFilesReadonly.channels,
      },
    },
  })
