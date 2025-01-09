import * as sdk from '@botpress/sdk'

// this type is not exported by the sdk: it's a placeholder for the integration type
type BaseIntegration = never

type ValueOf<T> = T[Extract<keyof T, string>]

type CommonActionProps<
  IP extends sdk.IntegrationProps<TIntegration>,
  TIntegration extends BaseIntegration = IP extends sdk.IntegrationProps<infer TI> ? TI : never,
> = Parameters<ValueOf<IP['actions']>>[0]
type ToolFactory<
  ReturnType,
  IP extends sdk.IntegrationProps<TIntegration>,
  TIntegration extends BaseIntegration = IP extends sdk.IntegrationProps<infer TI> ? TI : never,
> = (props: CommonActionProps<IP, TIntegration>) => ReturnType | Promise<ReturnType>

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
 * Creates an action wrapper for handling the action logic of your itegration.
 *
 * @template IP - Use `bp.IntegrationProps` as the type parameter.
 *
 * @example
 * import * as bp from '.botpress'
 *
 * const wrapAction = createActionWrapper<bp.IntegrationProps>()({
 *   toolFactories: {
 *     apiClient: ({ ctx }) => new ApiClient(ctx),
 *   },
 *   extraMetadata: {} as {
 *     errorMessage: string
 *   },
 * })
 *
 * export default const integration = new bp.Integration({
 *   actions: {
 *     actionName: wrapAction(
 *       { actionName: 'actionName', errorMessage: 'Failed to execute action' },
 *       async ({ apiClient, input: { payload } }) => {
 *         const { id } = await apiClient.doSomething(payload)
 *
 *         return { id }
 *       }
 *     )
 *   },
 * })
 */
export const createActionWrapper =
  <
    IP extends sdk.IntegrationProps<TIntegration>,
    TIntegration extends BaseIntegration = IP extends sdk.IntegrationProps<infer TI> ? TI : never,
    ACTIONS extends IP['actions'] = IP['actions'],
  >() =>
  <TOOLSET extends Record<string, ToolFactory<any, IP, TIntegration>>, EXTRAMETA extends Record<string, any> = {}>({
    toolFactories,
    extraMetadata: _,
  }: {
    toolFactories: TOOLSET
    extraMetadata?: EXTRAMETA
  }) =>
  /**
   * Wraps an action handler with the tools provided in the toolset.
   *
   * @param _metadata - The metadata of the action.
   * @param actionImpl - The implementation of the action handler.
   *   This is a function that receives as its first parameter the generic props
   *   for actions (ctx, client, logger, etc.), as well as the tools provided by
   *   For example, if the toolset provides an `apiClient` tool, the action
   *   implementation may access this tool by doing `props.apiClient`, or by
   *   destructuring the props object.
   */
  <ANAME extends Extract<keyof ACTIONS, string>, AFUNC extends ACTIONS[ANAME], APROPS extends Parameters<AFUNC>[0]>(
    _metadata: { actionName: ANAME } & EXTRAMETA,
    actionImpl: (
      props: APROPS & InferToolsFromToolset<TOOLSET, IP, TIntegration>,
      input: APROPS['input']
    ) => VoidIfEmptyRecord<ReturnType<AFUNC>>
  ): AFUNC =>
    (async (props: APROPS) => {
      const tools: Record<string, any> = {}
      for (const [tool, factory] of Object.entries(toolFactories)) {
        tools[tool] = await factory(props)
      }

      return (
        (await actionImpl(
          {
            ...props,
            ...tools,
          } as APROPS & InferToolsFromToolset<TOOLSET, IP, TIntegration>,
          props.input
        )) ?? {}
      )
    }) as AFUNC

type IsEmptyRecord<T> = T extends Record<string, never> ? (keyof T extends never ? true : false) : false
type VoidIfEmptyRecord<T extends Promise<any>> = IsEmptyRecord<Awaited<T>> extends true ? T | Promise<void> : T
