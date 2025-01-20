/* bplint-disable */
import * as sdk from '@botpress/sdk'
import * as genenv from './.genenv'
import chat from './bp_modules/chat'
import linear from './bp_modules/linear'
import synchronizer from './bp_modules/synchronizer'

const linearIssue = linear.definition.interfaces['listable<issue>']

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
    configuration: {
      tableName: 'linearIssuesTable',
    },
    interfaces: {
      listable: {
        id: linear.id,
        name: linear.name,
        version: linear.version,
        entities: linearIssue.entities,
        actions: linearIssue.actions,
        channels: linearIssue.channels,
        events: linearIssue.events,
      },
    },
  })
