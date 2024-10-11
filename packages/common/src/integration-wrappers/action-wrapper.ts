import * as sdk from '@botpress/sdk'
import { ValueOf } from '@botpress/sdk/dist/type-utils'

type CommonActionProps = Parameters<ValueOf<sdk.IntegrationProps['actions']>>[0]
type ToolFactory<ReturnType> = (props: CommonActionProps) => ReturnType

type InferToolsFromToolset<Toolset> = {
  [Tool in keyof Toolset]: Toolset[Tool] extends ToolFactory<infer ReturnType> ? ReturnType : never
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
  <IP extends sdk.IntegrationProps, ACTIONS extends Record<string, (...args: any) => any> = IP['actions']>() =>
  <TOOLSET extends Record<string, ToolFactory<any>>>(toolset: TOOLSET) =>
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
  <ANAME extends keyof ACTIONS, ACTION extends ACTIONS[ANAME], APROPS extends Parameters<ACTION>[0]>(
    _actionName: ANAME,
    actionImpl: (props: APROPS & InferToolsFromToolset<TOOLSET>) => ReturnType<ACTION>
  ): ACTION => {
    const createTools = (props: APROPS) =>
      Object.fromEntries(Object.entries(toolset).map(([tool, factory]) => [tool, factory(props)]))

    return ((props: APROPS) =>
      actionImpl({
        ...props,
        ...createTools(props),
      } as APROPS & InferToolsFromToolset<TOOLSET>)) as ACTION
  }
