/* bplint-disable */
import * as sdk from '@botpress/sdk'
import * as genenv from './.genenv'
import chat from './bp_modules/chat'
import linear from './bp_modules/linear'
import synchronizer from './bp_modules/synchronizer'

const linearListableIssue = linear.definition.interfaces['listable<issue>']
const linearDeletableIssue = linear.definition.interfaces['deletable<issue>']

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
        entities: linearListableIssue.entities,
        actions: linearListableIssue.actions,
        channels: linearListableIssue.channels,
        events: linearListableIssue.events,
      },
      deletable: {
        id: linear.id,
        name: linear.name,
        version: linear.version,
        entities: linearDeletableIssue.entities,
        actions: linearDeletableIssue.actions,
        channels: linearDeletableIssue.channels,
        events: linearDeletableIssue.events,
      },
    },
  })
