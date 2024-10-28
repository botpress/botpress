import * as integration from './integration'
import * as intrface from './interface'
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

export type Package = IntegrationPackage | InterfacePackage

type _test_expect_integration_definition_to_be_valid_package = utils.types.AssertTrue<
  utils.types.AssertExtends<IntegrationPackageDefinition, integration.IntegrationDefinition>
>
type _test_expect_interface_definition_to_be_valid_package = utils.types.AssertTrue<
  utils.types.AssertExtends<InterfacePackageDefinition, intrface.InterfaceDeclaration>
>
