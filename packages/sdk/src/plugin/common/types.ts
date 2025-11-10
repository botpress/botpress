import type { BaseInterface } from '../../interface'
import type { Cast, Join, UnionToIntersection } from '../../utils/type-utils'
import type { BasePlugin } from './generic'

type EventKey<TIntegrationName extends string, TEventName extends string> = string extends TIntegrationName
  ? string
  : string extends TEventName
    ? string
    : Join<[TIntegrationName, ':', TEventName]>

export type EnumerateInterfaceEvents<TPlugin extends BasePlugin> = UnionToIntersection<
  {
    [TInterfaceName in keyof TPlugin['interfaces']]: {
      [TEventName in keyof TPlugin['interfaces'][TInterfaceName]['events'] as EventKey<
        Cast<TInterfaceName, string>,
        Cast<TEventName, string>
      >]: TPlugin['interfaces'][TInterfaceName]['events'][TEventName]
    }
  }[keyof TPlugin['interfaces']]
>

/**
 * Used by a bot to tell the plugin what integration should be used to implement an interface.
 */
export type PluginInterfaceExtension<TInterface extends BaseInterface = BaseInterface> = {
  id?: string // id of the integration to use
  name: string // name of the integration to use
  version: string // version of the integration to use
  integrationAlias: string
  integrationInterfaceAlias: string
  entities: { [K in keyof TInterface['entities']]: { name: string } }
  actions: { [K in keyof TInterface['actions']]: { name: string } }
  events: { [K in keyof TInterface['events']]: { name: string } }
  channels: { [K in keyof TInterface['channels']]: { name: string } }
}

export type PluginIntegrationExtension = {
  id?: string
  name: string
  version: string
  integrationAlias: string
}

export type PluginInterfaceExtensions<TPlugin extends BasePlugin = BasePlugin> = {
  [TPluginInterfaceAlias in keyof TPlugin['interfaces']]: PluginInterfaceExtension<
    TPlugin['interfaces'][TPluginInterfaceAlias]
  >
}

export type PluginIntegrationExtensions<TPlugin extends BasePlugin = BasePlugin> = {
  [TPluginIntegrationAlias in keyof TPlugin['integrations']]: PluginIntegrationExtension
}

export type PluginConfiguration<TPlugin extends BasePlugin> = TPlugin['configuration']

export type PluginRuntimeProps<TPlugin extends BasePlugin = BasePlugin> = {
  alias: string
  configuration: PluginConfiguration<TPlugin>
  interfaces: PluginInterfaceExtensions<TPlugin>
  integrations: PluginIntegrationExtensions<TPlugin>
}
