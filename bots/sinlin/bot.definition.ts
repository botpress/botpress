/* bplint-disable */
import * as sdk from '@botpress/sdk'
import * as genenv from './.genenv'
import chat from './bp_modules/chat'
import linear from './bp_modules/linear'
import synchronizer from './bp_modules/synchronizer'

export default new sdk.BotDefinition({})
  .addIntegration(linear, {
    enabled: true,
    configurationType: 'apiKey',
    configuration: {
      apiKey: genenv.SINLIN_LINEAR_API_KEY,
      webhookSigningSecret: genenv.SINLIN_LINEAR_WEBHOOK_SIGNING_SECRET,
    },
  })
  .addIntegration(chat, {
    enabled: true,
    configuration: {},
  })
  .addPlugin(synchronizer, {
    alias: 'linear',
    configuration: {
      tableName: 'linearIssuesTable',
    },
    dependencies: {
      listable: {
        integrationAlias: 'linear',
        integrationInterfaceAlias: 'listable<issue>',
      },
      deletable: {
        integrationAlias: 'linear',
        integrationInterfaceAlias: 'deletable<issue>',
      },
    },
  })
