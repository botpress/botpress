import * as sdk from '@botpress/sdk'

// this type is not exported by the sdk: it's a placeholder for the integration type
type BaseIntegration = never

type ValueOf<T> = T[Extract<keyof T, string>]

type CommonChannelProps<
  IP extends sdk.IntegrationProps<TIntegration>,
  TIntegration extends BaseIntegration = IP extends sdk.IntegrationProps<infer TI> ? TI : never,
> = Parameters<ValueOf<ValueOf<IP['channels']>['messages']>>[0]

type ToolFactory<
  ReturnType,
  IP extends sdk.IntegrationProps<TIntegration>,
  TIntegration extends BaseIntegration = IP extends sdk.IntegrationProps<infer TI> ? TI : never,
> = (props: CommonChannelProps<IP, TIntegration>) => ReturnType | Promise<ReturnType>

type InferToolsFromToolset<
  Toolset,
  IP extends sdk.IntegrationProps<TIntegration>,
  TIntegration extends BaseIntegration = IP extends sdk.IntegrationProps<infer TI> ? TI : never,
> = {
  [Tool in Extract<keyof Toolset, string>]: Toolset[Tool] extends ToolFactory<infer ReturnType, IP, TIntegration>
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
 *   toolFactories: {
 *     apiClient: ({ ctx }) => new ApiClient(ctx),
 *   },
 * })
 *
 * export default const integration = new bp.Integration({
 *   channels: {
 *     channelName: {
 *       messages: {
 *         text: wrapChannel(
 *           { channelName: 'channelName', messageType: 'text' },
 *           async ({ ack, payload, apiClient }) => {
 *             const newMsg = await apiClient.sendTextMessage(text)
 *             await ack({ tags: { msgId: newMsg.id } })
 *           }
 *         )
 *       }
 *     }
 *   },
 * })
 */
export const createChannelWrapper =
  <
    IP extends sdk.IntegrationProps<TIntegration>,
    TIntegration extends BaseIntegration = IP extends sdk.IntegrationProps<infer TI> ? TI : never,
    CHANNELS extends IP['channels'] = IP['channels'],
  >() =>
  <TOOLSET extends Record<string, ToolFactory<any, IP, TIntegration>>, EXTRAMETA extends Record<string, any> = {}>({
    toolFactories,
    extraMetadata: _,
  }: {
    toolFactories: TOOLSET
    extraMetadata?: EXTRAMETA
  }) =>
  /**
   * Wraps a channel message handler with the tools provided in the toolset.
   *
   * @param _metadata - The metadata of the channel.
   * @param channelImpl - The implementation of the channel message handler.
   *   This is a function that receives as its first parameter the generic props
   *   for channels (ctx, client, logger, ack, etc.), as well as the tools
   *   provided by the toolset. For example, if the toolset provides an
   *   `apiClient` tool, the channel implementation may access this tool by
   *   doing `props.apiClient`, or by destructuring the props object.
   */
  <
    CNAME extends Extract<keyof CHANNELS, string>,
    MTYPE extends Extract<keyof CHANNELS[CNAME]['messages'], string>,
    CFUNC extends CHANNELS[CNAME]['messages'][MTYPE],
    CFUNCPROPS extends Parameters<CFUNC>[0],
  >(
    _metadata: { channelName: CNAME; messageType: MTYPE } & EXTRAMETA,
    channelImpl: (props: CFUNCPROPS & InferToolsFromToolset<TOOLSET, IP, TIntegration>) => Promise<void>
  ): CFUNC =>
    (async (props: CFUNCPROPS) => {
      const tools: Record<string, any> = {}
      for (const [tool, factory] of Object.entries(toolFactories)) {
        tools[tool] = await factory(props)
      }

      await channelImpl({
        ...props,
        ...tools,
      } as CFUNCPROPS & InferToolsFromToolset<TOOLSET, IP, TIntegration>)
    }) as CFUNC
