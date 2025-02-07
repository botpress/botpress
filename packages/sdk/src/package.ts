import * as integration from './integration'
import * as intrface from './interface'
import * as plugin from './plugin'
import * as utils from './utils/type-utils'

type NameVersion = {
  name: string
  version: string
}

type PackageReference = NameVersion & {
  id?: string
  uri?: string
}

type IntegrationPackageDefinitionInterface = utils.Merge<PackageReference, integration.InterfaceExtension>
type IntegrationPackageDefinition = NameVersion & {
  configuration?: integration.ConfigurationDefinition
  configurations?: Record<string, integration.AdditionalConfigurationDefinition>
  events?: Record<string, integration.EventDefinition>
  actions?: Record<string, integration.ActionDefinition>
  channels?: Record<string, integration.ChannelDefinition>
  states?: Record<string, integration.StateDefinition>
  user?: integration.UserDefinition
  secrets?: Record<string, integration.SecretDefinition>
  entities?: Record<string, integration.EntityDefinition>
  interfaces?: Record<string, IntegrationPackageDefinitionInterface>
}

type InterfacePackageDefinition = NameVersion & {
  entities?: Record<string, integration.EntityDefinition>
  events?: Record<string, integration.EventDefinition>
  actions?: Record<string, integration.ActionDefinition>
  channels?: Record<string, integration.ChannelDefinition>
}

type PluginPackageDefinition = NameVersion & {
  integrations?: Record<string, PackageReference>
  interfaces?: Record<string, PackageReference>
  user?: plugin.UserDefinition
  conversation?: plugin.ConversationDefinition
  message?: plugin.MessageDefinition
  states?: Record<string, plugin.StateDefinition>
  configuration?: plugin.ConfigurationDefinition
  events?: Record<string, plugin.EventDefinition>
  recurringEvents?: Record<string, plugin.RecurringEventDefinition>
  actions?: Record<string, plugin.ActionDefinition>
  tables?: Record<string, plugin.TableDefinition>
}

export type IntegrationPackage = PackageReference & {
  type: 'integration'
  definition: IntegrationPackageDefinition
  implementation?: null
}

export type InterfacePackage = PackageReference & {
  type: 'interface'
  definition: InterfacePackageDefinition
  implementation?: null
}

export type PluginPackage = PackageReference & {
  type: 'plugin'
  definition: PluginPackageDefinition
  implementation: Buffer
}

export type Package = IntegrationPackage | InterfacePackage | PluginPackage

type _test_expect_integration_definition_to_be_valid_package = utils.AssertExtends<
  integration.IntegrationDefinition,
  IntegrationPackageDefinition
>

type _test_expect_interface_definition_to_be_valid_package = utils.AssertExtends<
  intrface.InterfaceDefinition,
  InterfacePackageDefinition
>

type _test_expect_plugin_definition_to_be_valid_package = utils.AssertExtends<
  plugin.PluginDefinition,
  PluginPackageDefinition
>
