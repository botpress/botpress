import * as sdk from '@botpress/sdk'
import chat from './bp_modules/chat'

export default new sdk.BotDefinition({
  integrations: {},
  states: {},
  events: {},
  recurringEvents: {},
}).addIntegration(chat, { enabled: true, configuration: {} })
