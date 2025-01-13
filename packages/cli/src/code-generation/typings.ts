import * as client from '@botpress/client'
import * as utils from '../utils'

type NameVersion = { name: string; version: string }
type Schema = Record<string, any>
type Aliases = Record<string, { name: string }>

export type File = { path: string; content: string }

export type IntegrationDefinition = {
  id?: string
  name: string
  version: string
  interfaces?: Record<
    string,
    {
      id?: string
      entities?: Aliases
      actions?: Aliases
      events?: Aliases
      channels?: Aliases
    }
  >
  configuration?: {
    schema?: Schema
  }
  configurations?: Record<
    string,
    {
      schema?: Schema
    }
  >
  channels?: Record<
    string,
    {
      messages: Record<string, { schema: Schema }>
      conversation?: {
        tags?: Record<string, {}>
        creation?: {
          enabled: boolean
          requiredTags: string[]
        }
      }
      message?: {
        tags?: Record<string, {}>
      }
    }
  >
  states?: Record<
    string,
    {
      type: client.State['type']
      schema: Schema
    }
  >
  events?: Record<string, { schema: Schema }>
  actions?: Record<
    string,
    {
      input: {
        schema: Schema
      }
      output: {
        schema: Schema
      }
    }
  >
  entities?: Record<string, { schema: Schema }>
  user?: {
    tags?: Record<string, {}>
    creation?: {
      enabled: boolean
      requiredTags: string[]
    }
  }
}

export type InterfaceDefinition = {
  id?: string
  name: string
  version: string
  entities?: Record<string, { schema: Schema }>
  events?: Record<string, { schema: Schema }>
  actions?: Record<
    string,
    {
      input: { schema: Schema }
      output: {
        schema: Schema
      }
    }
  >
  channels?: Record<string, { messages: Record<string, { schema: Schema }> }>
}

export type PluginDefinition = {
  id?: string
  name: string
  version: string
  configuration?: { schema?: Schema }
  states?: Record<string, { type: client.State['type']; schema: Schema }>
  events?: Record<string, { schema: Schema }>
  actions?: Record<string, { input: { schema: Schema }; output: { schema: Schema } }>
  user?: {
    tags: Record<string, {}>
  }
  code: string
}

export type IntegrationInstallablePackage = NameVersion & {
  integration: IntegrationDefinition
  devId?: string
  path?: utils.path.AbsolutePath
}

export type InterfaceInstallablePackage = NameVersion & {
  interface: InterfaceDefinition
  path?: utils.path.AbsolutePath
}

export type PluginInstallablePackage = NameVersion & {
  plugin: PluginDefinition & { code: string }
  path?: utils.path.AbsolutePath
}

type _test_integration_response_extends_integration_definition = utils.types.AssertExtends<
  client.Integration,
  IntegrationDefinition
>

type _test_integration_request_extends_integration_definition = utils.types.AssertExtends<
  client.ClientInputs['createIntegration'],
  IntegrationDefinition
>

type _test_interface_response_extends_interface_definition = utils.types.AssertExtends<
  client.Interface,
  InterfaceDefinition
>

type _test_interface_request_extends_interface_definition = utils.types.AssertExtends<
  client.ClientInputs['createInterface'],
  InterfaceDefinition
>

type _test_plugin_response_extends_plugin_definition = utils.types.AssertExtends<
  //
  client.Plugin,
  PluginDefinition
>

type _test_plugin_request_extends_plugin_definition = utils.types.AssertExtends<
  client.ClientInputs['createPlugin'],
  PluginDefinition
>
