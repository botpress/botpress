import { BotDefinition } from '@botpress/sdk'
import anthropic from './bp_modules/anthropic'
import chat from './bp_modules/chat'
import grafana from './bp_modules/my-handle-1-grafana'
import webchat from './bp_modules/webchat'
import { conversation } from './definitions/conversation'
import { states } from './definitions/states'
import { tables } from './definitions/tables'

export default new BotDefinition({ tables, conversation, states })
  .addIntegration(chat, { enabled: true, configuration: {} })
  .addIntegration(webchat, { enabled: true, configuration: {} })
  .addIntegration(anthropic, { enabled: true, configuration: {} })
  .addIntegration(grafana, {
    enabled: true,
    configuration: {
      grafanaUsername: process.env.GRAFANA_USERNAME!,
      grafanaServiceAccountToken: process.env.GRAFANA_TOKEN!,
    },
  })
