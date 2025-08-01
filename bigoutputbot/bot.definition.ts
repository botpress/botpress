import { BotDefinition } from '@botpress/sdk'
import chat from 'bp_modules/chat'
import integ from 'bp_modules/bigoutput'

export default new BotDefinition({})
  .addIntegration(integ, { configuration: {}, enabled: true })
  .addIntegration(chat, { configuration: {}, enabled: true })
