import * as sdk from '@botpress/sdk'
import * as utils from '../utils'
import { resolveInterfaces } from './resolve-integration-interfaces'

type IntegrationPackageDefinition = sdk.IntegrationPackage['definition']

type _assertPropsInIntegrationDefinition = utils.types.AssertKeyOf<'props', sdk.IntegrationDefinition>
const _isLocalIntegrationDef = (
  integration: sdk.IntegrationDefinition | IntegrationPackageDefinition
): integration is sdk.IntegrationDefinition => {
  return 'props' in integration
}

export const resolveBotInterfaces = (bot: sdk.BotDefinition): sdk.BotDefinition => {
  for (const integration of Object.values(bot.integrations ?? {})) {
    if (!integration.definition.interfaces) {
      continue
    }

    if (_isLocalIntegrationDef(integration.definition)) {
      integration.definition = resolveInterfaces(integration.definition)
    }
  }
  return bot
}
