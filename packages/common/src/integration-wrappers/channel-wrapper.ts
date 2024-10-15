import * as sdk from '@botpress/sdk'
import { BaseIntegration } from '@botpress/sdk/dist/integration/generic'
import { ValueOf } from '@botpress/sdk/dist/type-utils'

type CommonChannelProps<
  IP extends sdk.IntegrationProps<TIntegration>,
  TIntegration extends BaseIntegration = IP extends sdk.IntegrationProps<infer TI> ? TI : never
> = Parameters<ValueOf<ValueOf<IP['channels']>['messages']>>[0]

type ToolFactory<
  ReturnType,
  IP extends sdk.IntegrationProps<TIntegration>,
  TIntegration extends BaseIntegration = IP extends sdk.IntegrationProps<infer TI> ? TI : never
> = (props: CommonChannelProps<IP, TIntegration>) => ReturnType | Promise<ReturnType>

type InferToolsFromToolset<
  Toolset,
  IP extends sdk.IntegrationProps<TIntegration>,
  TIntegration extends BaseIntegration = IP extends sdk.IntegrationProps<infer TI> ? TI : never
> = {
  [Tool in keyof Toolset]: Toolset[Tool] extends ToolFactory<infer ReturnType, IP, TIntegration>
    ? Awaited<ReturnType>
    : never
}

/**
 * Creates a channel wrapper for handling the channel logic of your itegration.
 *
 * @template IP - Use `bp.IntegrationProps` as the type parameter.
 *
 * @example
 * import * as bp from '.botpress'
 *
 * const wrapChannel = createChannelWrapper<bp.IntegrationProps>()({
 *   apiClient: async ({ ctx }) => await ApiClient.create(ctx),
 * })
 *
 * export default const integration = new bp.Integration({
 *   channels: {
 *     channelName: {
 *       messages: {
 *         text: wrapChannel('channelName', 'text', async ({ ack, payload, apiClient }) => {
 *           const newMsg = await apiClient.sendTextMessage(text)
 *           await ack({ tags: { msgId: newMsg.id } })
 *         })
 *       }
 *     }
 *   },
 * })
 */
export const createChannelWrapper =
  <
    IP extends sdk.IntegrationProps<TIntegration>,
    TIntegration extends BaseIntegration = IP extends sdk.IntegrationProps<infer TI> ? TI : never,
    CHANNELS extends IP['channels'] = IP['channels']
  >() =>
  <TOOLSET extends Record<string, ToolFactory<any, IP, TIntegration>>>(toolset: TOOLSET) =>
  /**
   * Wraps a channel message handler with the tools provided in the toolset.
   *
   * @param _channelName - The name of the channel.
   * @param _messageType - The type of the message (text, image, etc.).
   * @param channelImpl - The implementation of the channel message handler.
   *   This is a function that receives as its first parameter the generic props
   *   for channels (ctx, client, logger, ack, etc.), as well as the tools
   *   provided by the toolset. For example, if the toolset provides an
   *   `apiClient` tool, the channel implementation may access this tool by
   *   doing `props.apiClient`, or by destructuring the props object.
   */
  <
    CNAME extends keyof CHANNELS,
    MTYPE extends keyof CHANNELS[CNAME]['messages'],
    CFUNC extends CHANNELS[CNAME]['messages'][MTYPE],
    CFUNCPROPS extends Parameters<CFUNC>[0]
  >(
    _channelName: CNAME,
    _messageType: MTYPE,
    channelImpl: (props: CFUNCPROPS & InferToolsFromToolset<TOOLSET, IP, TIntegration>) => Promise<void>
  ): CFUNC =>
    (async (props: CFUNCPROPS) => {
      const tools: Record<string, any> = {}
      for (const [tool, factory] of Object.entries(toolset)) {
        tools[tool] = await factory(props)
      }

      await channelImpl({
        ...props,
        ...tools,
      } as CFUNCPROPS & InferToolsFromToolset<TOOLSET, IP, TIntegration>)
    }) as CFUNC
