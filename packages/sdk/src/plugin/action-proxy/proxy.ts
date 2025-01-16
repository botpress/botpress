import { Client } from '@botpress/client'
import { BotSpecificClient } from '../../bot'
import { resolveAction, formatActionRef } from '../interface-resolution'
import { BasePlugin, PluginInterfaceExtensions } from '../types'
import { ActionProxy } from './types'

export const proxyActions = <TPlugin extends BasePlugin>(
  client: BotSpecificClient<TPlugin> | Client,
  interfaces: PluginInterfaceExtensions<TPlugin>
): ActionProxy<TPlugin> =>
  new Proxy<Partial<ActionProxy<TPlugin>>>(
    {},
    {
      get: (_target, prop1) => {
        return new Proxy(
          {},
          {
            get: (_target, prop2) => {
              return (input: Record<string, any>) =>
                _callAction({
                  client,
                  interfaces,
                  integrationOrInterfaceName: prop1 as string,
                  methodName: prop2 as string,
                  input,
                })
            },
          }
        )
      },
    }
  ) as ActionProxy<TPlugin>

type CallActionsProps = {
  client: BotSpecificClient<any> | Client
  interfaces: PluginInterfaceExtensions<any>
  integrationOrInterfaceName: string
  methodName: string
  input: Record<string, any>
}
const _callAction = async ({ client, interfaces, integrationOrInterfaceName, methodName, input }: CallActionsProps) => {
  const resolvedAction = resolveAction(
    {
      namespace: integrationOrInterfaceName,
      actionName: methodName,
    },
    interfaces
  )
  const type = formatActionRef(resolvedAction)
  const response = await client.callAction({
    type,
    input,
  })
  return response.output
}
