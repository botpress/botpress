import { BasePlugin } from '../types'

type IntegrationActionProxy<TPlugin extends BasePlugin> = {
  [TIntegrationName in keyof TPlugin['integrations']]: {
    [TActionName in keyof TPlugin['integrations'][TIntegrationName]['actions']]: (
      input: TPlugin['integrations'][TIntegrationName]['actions'][TActionName]['input']
    ) => Promise<TPlugin['integrations'][TIntegrationName]['actions'][TActionName]['output']>
  }
}

type SelfActionProxy<TPlugin extends BasePlugin> = {
  self: {
    [TActionName in keyof TPlugin['actions']]: (
      input: TPlugin['actions'][TActionName]['input']
    ) => Promise<TPlugin['actions'][TActionName]['output']>
  }
}

type InterfacesActionProxy<TPlugin extends BasePlugin> = {
  [TInterfaceName in keyof TPlugin['interfaces']]: {
    [TActionName in keyof TPlugin['interfaces'][TInterfaceName]['actions']]: (
      input: TPlugin['interfaces'][TInterfaceName]['actions'][TActionName]['input']
    ) => Promise<TPlugin['interfaces'][TInterfaceName]['actions'][TActionName]['output']>
  }
}

export type ActionProxy<TPlugin extends BasePlugin> = IntegrationActionProxy<TPlugin> &
  SelfActionProxy<TPlugin> &
  InterfacesActionProxy<TPlugin>
