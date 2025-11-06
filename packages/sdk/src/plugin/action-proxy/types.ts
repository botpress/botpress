import * as utils from '../../utils/type-utils'
import { BasePlugin } from '../common'

export type ActionProxy<TPlugin extends BasePlugin> = {
  forIntegration: <TPluginIntegrationAlias extends utils.StringKeys<TPlugin['integrations']>>(
    integrationAlias: TPluginIntegrationAlias
  ) => {
    [TActionName in keyof TPlugin['integrations'][TPluginIntegrationAlias]['actions']]: (
      input: TPlugin['integrations'][TPluginIntegrationAlias]['actions'][TActionName]['input']
    ) => Promise<TPlugin['integrations'][TPluginIntegrationAlias]['actions'][TActionName]['output']>
  }
  forInterface: <TPluginInterfaceAlias extends utils.StringKeys<TPlugin['interfaces']>>(
    interfaceAlias: TPluginInterfaceAlias
  ) => {
    [TActionName in keyof TPlugin['interfaces'][TPluginInterfaceAlias]['actions']]: (
      input: TPlugin['interfaces'][TPluginInterfaceAlias]['actions'][TActionName]['input']
    ) => Promise<TPlugin['interfaces'][TPluginInterfaceAlias]['actions'][TActionName]['output']>
  }
}
