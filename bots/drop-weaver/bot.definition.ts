import * as sdk from '@botpress/sdk'
import * as genenv from './.genenv'
import dropbox from './bp_modules/dropbox'
import fileSynchronizer from './bp_modules/file-synchronizer'

export default new sdk.BotDefinition({
  configuration: {
    schema: sdk.z.object({}),
  },
})
  .addIntegration(dropbox, {
    alias: 'dropbox-a',
    enabled: true,
    configuration: {
      authorizationCode: genenv.DROPBOX_A_ACCESS_CODE,
      clientId: genenv.DROPBOX_A_APP_KEY,
      clientSecret: genenv.DROPBOX_A_APP_SECRET,
    },
  })
  .addIntegration(dropbox, {
    alias: 'dropbox-b',
    enabled: true,
    configuration: {
      authorizationCode: genenv.DROPBOX_B_ACCESS_CODE,
      clientId: genenv.DROPBOX_B_APP_KEY,
      clientSecret: genenv.DROPBOX_B_APP_SECRET,
    },
  })
  .addPlugin(fileSynchronizer, {
    alias: 'file-synchronizer-a',
    configuration: {
      includeFiles: [{ pathGlobPattern: '**' }],
      excludeFiles: [],
      enableRealTimeSync: true,
    },
    dependencies: {
      'files-readonly': {
        integrationAlias: 'dropbox-a',
        integrationInterfaceAlias: 'files-readonly',
      },
    },
  })
  .addPlugin(fileSynchronizer, {
    alias: 'file-synchronizer-b',
    configuration: {
      includeFiles: [{ pathGlobPattern: '**' }],
      excludeFiles: [],
      enableRealTimeSync: true,
    },
    dependencies: {
      'files-readonly': {
        integrationAlias: 'dropbox-b',
        integrationInterfaceAlias: 'files-readonly',
      },
    },
  })
