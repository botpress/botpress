import * as client from '@botpress/client'
import * as utils from '../utils'

type NameVersion = { name: string; version: string }
type PackageRef = { id?: string; name: string; version: string }
type Schema = Record<string, any>
type Aliases = Record<string, { name: string }>

type TitleDescription = { title?: string; description?: string }

export type File = { path: string; content: string }

export type IntegrationDefinition = PackageRef & {
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
  configuration?: TitleDescription & {
    schema?: Schema
  }
  configurations?: Record<
    string,
    TitleDescription & {
      schema?: Schema
    }
  >
  channels?: Record<
    string,
    TitleDescription & {
      messages: Record<string, TitleDescription & { schema: Schema }>
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
    TitleDescription & {
      type: client.State['type']
      schema: Schema
    }
  >
  events?: Record<string, TitleDescription & { schema: Schema }>
  actions?: Record<
    string,
    TitleDescription & {
      billable?: boolean
      cacheable?: boolean
      input: {
        schema: Schema
      }
      output: {
        schema: Schema
      }
    }
  >
  entities?: Record<string, TitleDescription & { schema: Schema }>
  user?: {
    tags?: Record<string, {}>
    creation?: {
      enabled: boolean
      requiredTags: string[]
    }
  }
}

export type InterfaceDefinition = PackageRef & {
  entities?: Record<string, TitleDescription & { schema: Schema }>
  events?: Record<string, TitleDescription & { schema: Schema }>
  actions?: Record<
    string,
    TitleDescription & {
      billable?: boolean
      cacheable?: boolean
      input: { schema: Schema }
      output: { schema: Schema }
    }
  >
  channels?: Record<string, TitleDescription & { messages: Record<string, TitleDescription & { schema: Schema }> }>
}

export type PluginDefinition = PackageRef & {
  configuration?: TitleDescription & { schema?: Schema }
  user?: { tags: Record<string, {}> }
  conversation?: { tags: Record<string, {}> }
  states?: Record<string, TitleDescription & { type: client.State['type']; schema: Schema }>
  events?: Record<string, TitleDescription & { schema: Schema }>
  actions?: Record<string, TitleDescription & { input: { schema: Schema }; output: { schema: Schema } }>
  dependencies?: {
    interfaces?: Record<string, PackageRef>
    integrations?: Record<string, PackageRef>
  }
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
  plugin: PluginDefinition
  path?: utils.path.AbsolutePath
  code: string
}
