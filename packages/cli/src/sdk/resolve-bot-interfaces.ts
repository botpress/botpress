import * as sdk from '@botpress/sdk'
import { resolveInterfaces } from './resolve-integration-interfaces'

export const resolveBotInterfaces = (bot: sdk.BotDefinition): sdk.BotDefinition => {
  for (const integration of Object.values(bot.integrations ?? {})) {
    if (!integration.definition.interfaces) {
      continue
    }

    /**
     * TODO: only resolve interfaces if the definition is instance of sdk.IntegrationDefinition
     * This is tricky because a simple check like `integration.definition instanceof sdk.IntegrationDefinition` won't work
     * Usage of a bundler can dupplicate class definitions and make the check fail
     */
    integration.definition = resolveInterfaces(integration.definition as sdk.IntegrationDefinition)
  }
  return bot
}
