import { Client } from '@botpress/client'
import { BotSpecificClient } from '../../bot'
import { BasePlugin, PluginRuntimeProps } from '../common'
import { ActionProxy } from './types'

export const proxyActions = <TPlugin extends BasePlugin>(props: {
  client: BotSpecificClient<TPlugin> | Client
  plugin: PluginRuntimeProps<TPlugin>
}): ActionProxy<TPlugin> => ({
  forIntegration: (pluginIntegrationAlias) =>
    new Proxy(
      {},
      {
        get: (_target, actionName: string) => (input: Record<string, any>) =>
          props.client.callAction({
            type: `${props.plugin.integrations[pluginIntegrationAlias].integrationAlias}:${actionName}` as any,
            input,
          }),
      }
    ) as ReturnType<ActionProxy<TPlugin>['forIntegration']>,
  forInterface: (pluginInterfaceAlias) =>
    new Proxy(
      {},
      {
        get: (_target, actionName: string) => (input: Record<string, any>) =>
          props.client.callAction({
            type: `${props.plugin.interfaces[pluginInterfaceAlias].integrationAlias}:${actionName}` as any,
            input,
          }),
      }
    ) as ReturnType<ActionProxy<TPlugin>['forIntegration']>,
})
