import * as sdk from '@botpress/sdk'
import { resolveInterfaces } from './resolve-integration-interfaces'

export const resolveBotInterfaces = (bot: sdk.BotDefinition): sdk.BotDefinition => {
  for (const integration of Object.values(bot.integrations ?? {})) {
    if (!integration.definition.interfaces) {
      continue
    }
    integration.definition = resolveInterfaces(integration.definition)
  }
  return bot
}
