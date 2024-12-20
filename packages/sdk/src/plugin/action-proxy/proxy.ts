import { BotSpecificClient } from '../../bot'
import { BasePlugin, PluginInterfaceExtensions } from '../types'
import { ActionProxy } from './types'

export const proxy =
  <TPlugin extends BasePlugin>(client: BotSpecificClient<TPlugin>) =>
  (interfaces: PluginInterfaceExtensions<TPlugin>): ActionProxy<TPlugin> =>
    new Proxy<Partial<ActionProxy<TPlugin>>>(
      {},
      {
        get: (_target, prop1) => {
          return new Proxy(
            {},
            {
              get: (_target, prop2) => {
                return (input: unknown) =>
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
  client: BotSpecificClient<any>
  interfaces: PluginInterfaceExtensions<any>
  integrationOrInterfaceName: string
  methodName: string
  input: unknown
}
const _callAction = async ({ client, interfaces, integrationOrInterfaceName, methodName, input }: CallActionsProps) => {
  const interfaceExtension = interfaces[integrationOrInterfaceName] ?? {
    name: integrationOrInterfaceName,
    version: '0.0.0',
    entities: {},
    actions: {},
    events: {},
    channels: {},
  }

  const prefix = interfaceExtension.name
  const suffix = interfaceExtension.actions[methodName]?.name ?? methodName
  const fullActionName = `${prefix}:${suffix}`
  const response = await client.callAction({
    type: fullActionName,
    input,
  })
  return response.output
}
