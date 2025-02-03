import * as utils from '../../utils/type-utils'
import { BasePlugin } from '../types'

type IntegrationActionProxy<TPlugin extends BasePlugin> = {
  [TIntegrationName in keyof TPlugin['integrations']]: {
    [TActionName in keyof TPlugin['integrations'][TIntegrationName]['actions']]: (
      input: TPlugin['integrations'][TIntegrationName]['actions'][TActionName]['input']
    ) => Promise<TPlugin['integrations'][TIntegrationName]['actions'][TActionName]['output']>
  }
}

type InterfacesActionProxy<TPlugin extends BasePlugin> = {
  [TInterfaceName in keyof TPlugin['interfaces']]: {
    [TActionName in keyof TPlugin['interfaces'][TInterfaceName]['actions']]: (
      input: TPlugin['interfaces'][TInterfaceName]['actions'][TActionName]['input']
    ) => Promise<TPlugin['interfaces'][TInterfaceName]['actions'][TActionName]['output']>
  }
}

// TODO: add self bot actions in proxy

export type ActionProxy<TPlugin extends BasePlugin> = utils.Normalize<
  IntegrationActionProxy<TPlugin> & InterfacesActionProxy<TPlugin>
>
