import * as integration from './integration'
import * as intrface from './interface'
import * as plugin from './plugin'
import * as utils from './utils'

type PackageReference =
  | {
      id: string // package installed from the botpress api
    }
  | {
      uri?: string // package installed locally or from npm
    }

type IntegrationPackageDefinition = {
  name: string
  version: string
  configuration?: integration.ConfigurationDefinition
  configurations?: Record<string, integration.AdditionalConfigurationDefinition>
  events?: Record<string, integration.EventDefinition>
  actions?: Record<string, integration.ActionDefinition>
  channels?: Record<string, integration.ChannelDefinition>
  states?: Record<string, integration.StateDefinition>
  user?: integration.UserDefinition
  secrets?: Record<string, integration.SecretDefinition>
  entities?: Record<string, integration.EntityDefinition>
  interfaces?: Record<string, integration.InterfaceInstance>
}

type InterfacePackageDefinition = {
  name: string
  version: string
  templateName?: string
  entities?: Record<string, integration.EntityDefinition>
  events?: Record<string, integration.EventDefinition>
  actions?: Record<string, integration.ActionDefinition>
  channels?: Record<string, integration.ChannelDefinition>
}

type PluginPackageDefinition = {
  name: string
  user?: plugin.UserDefinition
  conversation?: plugin.ConversationDefinition
  message?: plugin.MessageDefinition
  states?: Record<string, plugin.StateDefinition>
  configuration?: plugin.ConfigurationDefinition
  events?: Record<string, plugin.EventDefinition>
  recurringEvents?: Record<string, plugin.RecurringEventDefinition>
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
  implementation: {
    code: string
  }
}

export type Package = IntegrationPackage | InterfacePackage

type _test_expect_integration_definition_to_be_valid_package = utils.types.AssertTrue<
  utils.types.AssertExtends<integration.IntegrationDefinition, IntegrationPackageDefinition>
>
type _test_expect_interface_definition_to_be_valid_package = utils.types.AssertTrue<
  utils.types.AssertExtends<intrface.InterfaceDeclaration, InterfacePackageDefinition>
>
type _test_expect_plugin_definition_to_be_valid_package = utils.types.AssertTrue<
  utils.types.AssertExtends<plugin.PluginDefinition, PluginPackageDefinition>
>
