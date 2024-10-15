import * as sdk from '@botpress/sdk'
import { BaseIntegration } from '@botpress/sdk/dist/integration/generic'
import { ValueOf } from '@botpress/sdk/dist/type-utils'

type CommonActionProps<
  IP extends sdk.IntegrationProps<TIntegration>,
  TIntegration extends BaseIntegration = IP extends sdk.IntegrationProps<infer TI> ? TI : never
> = Parameters<ValueOf<IP['actions']>>[0]
type ToolFactory<
  ReturnType,
  IP extends sdk.IntegrationProps<TIntegration>,
  TIntegration extends BaseIntegration = IP extends sdk.IntegrationProps<infer TI> ? TI : never
> = (props: CommonActionProps<IP, TIntegration>) => ReturnType | Promise<ReturnType>

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
 * Creates an action wrapper for handling the action logic of your itegration.
 *
 * @template IP - Use `bp.IntegrationProps` as the type parameter.
 *
 * @example
 * import * as bp from '.botpress'
 *
 * const wrapAction = createActionWrapper<bp.IntegrationProps>()({
 *   apiClient: ({ ctx }) => new ApiClient(ctx),
 * })
 *
 * export default const integration = new bp.Integration({
 *   actions: {
 *     actionName: wrapAction('actionName', async ({ apiClient, input: { payload } }) => {
 *       const { id } = await apiClient.doSomething(payload)
 *
 *       return { id }
 *     })
 *   },
 * })
 */
export const createActionWrapper =
  <
    IP extends sdk.IntegrationProps<TIntegration>,
    TIntegration extends BaseIntegration = IP extends sdk.IntegrationProps<infer TI> ? TI : never,
    ACTIONS extends IP['actions'] = IP['actions']
  >() =>
  <TOOLSET extends Record<string, ToolFactory<any, IP, TIntegration>>>(toolset: TOOLSET) =>
  /**
   * Wraps an action handler with the tools provided in the toolset.
   *
   * @param _actionName - The name of the action.
   * @param actionImpl - The implementation of the action handler.
   *   This is a function that receives as its first parameter the generic props
   *   for actions (ctx, client, logger, etc.), as well as the tools provided by
   *   For example, if the toolset provides an `apiClient` tool, the action
   *   implementation may access this tool by doing `props.apiClient`, or by
   *   destructuring the props object.
   */
  <ANAME extends keyof ACTIONS, AFUNC extends ACTIONS[ANAME], APROPS extends Parameters<AFUNC>[0]>(
    _actionName: ANAME,
    actionImpl: (
      props: APROPS & InferToolsFromToolset<TOOLSET, IP, TIntegration>,
      input: APROPS['input']
    ) => ReturnType<AFUNC>
  ): AFUNC =>
    (async (props: APROPS) => {
      const tools: Record<string, any> = {}
      for (const [tool, factory] of Object.entries(toolset)) {
        tools[tool] = await factory(props)
      }

      return await actionImpl(
        {
          ...props,
          ...tools,
        } as APROPS & InferToolsFromToolset<TOOLSET, IP, TIntegration>,
        props.input
      )
    }) as AFUNC
