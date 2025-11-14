import { Client } from '@botpress/client'
import { BotSpecificClient, EnumerateActions } from '../../bot'
import type * as typeUtils from '../../utils/type-utils'
import { BasePlugin, PluginRuntimeProps } from '../common'
import { ActionProxy } from './types'

export const proxyActions = <TPlugin extends BasePlugin>(
  client: BotSpecificClient<TPlugin> | Client,
  props: PluginRuntimeProps<TPlugin>
): ActionProxy<TPlugin> =>
  new Proxy<Partial<ActionProxy<TPlugin>>>(
    {},
    {
      get: (_target, integrationOrInterfaceAlias: string) =>
        new Proxy(
          {},
          {
            get: (_target, actionName: string) => (input: Record<string, any>) => {
              const integrationAlias = (
                props.integrations[integrationOrInterfaceAlias] ?? props.interfaces[integrationOrInterfaceAlias]
              )?.integrationAlias
              const actualActionName =
                props.interfaces[integrationOrInterfaceAlias]?.actions?.[actionName]?.name ?? actionName

              return client.callAction({
                type: `${integrationAlias}:${actualActionName}` as typeUtils.Cast<
                  keyof EnumerateActions<TPlugin>,
                  string
                >,
                input,
              })
            },
          }
        ),
    }
  ) as ActionProxy<TPlugin>
