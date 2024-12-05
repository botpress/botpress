import * as sdk from '@botpress/sdk'
import { resolveInterfaces } from './resolve-integration-interfaces'

type IntegrationPackageDefinition = sdk.IntegrationPackage['definition']
type InterfaceReference = NonNullable<IntegrationPackageDefinition['interfaces']>[string]

const _isLocalInterfaceDef = (
  intrface: sdk.InterfaceDefinition | InterfaceReference
): intrface is sdk.InterfaceDefinition => {
  return 'props' in intrface
}

const _isLocalIntegrationDef = (
  integration: sdk.IntegrationDefinition | IntegrationPackageDefinition
): integration is sdk.IntegrationDefinition => {
  return Object.entries(integration.interfaces ?? {}).some(([_, intrface]) => _isLocalInterfaceDef(intrface))
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
