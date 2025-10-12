import * as sdk from '@botpress/sdk'
import chat from './bp_modules/chat'

export default new sdk.BotDefinition({
  integrations: {},
  states: {},
  events: {},
  recurringEvents: {},
  __advanced: {
    useLegacyZuiTransformer: true,
  },
}).addIntegration(chat, { enabled: true, configuration: {} })
