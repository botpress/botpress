import type * as client from '@botpress/client'
import type { BotSpecificClient } from '../../bot'
import { prefixTagsIfNeeded, unprefixTagsOwnedByPlugin } from '../../plugin/tag-prefixer'
import { createAsyncCollection } from '../../utils/api-paging-utils'
import type * as typeUtils from '../../utils/type-utils'
import type { BaseBot } from '../common'
import * as botServerTypes from '../server/types'
import type { WorkflowProxy, ActionableWorkflow } from './types'

// FIXME: Plugin (and bot) workflow definitions are currently being created on
//        the fly at run time. However, they should be part of the bot/plugin
//        definition. The SDK currently gives the illusion that they are defined
//        at deploy time, but in reality they are not. Nothing about the
//        workflows is sent to the backend at deploy time.
//
//        This is being tracked as https://linear.app/botpress/issue/KKN-292
//
//        Since currently each workflow definition is unique to a workflow run,
//        the tags are not prefixed by the plugin instance's alias. This is
//        because the backend's input validation prevents us from having a `#`
//        character in the workflow definition's tag definition. The plugin
//        prefix separator should only be present when we merge a plugin's
//        definitions into a bot (ie when installing a plugin in a bot). It
//        should not be allowed when calling the createWorkflow endpoint
//        directly, which is what the CLI currently does.
//
//        Once we have proper deploy-time workflow definitions, we should
//        prefix/unprefix the tags like we do in the other plugin proxies.
//
//        This means removing `undefined /* props.pluginAlias */` and replacing
//        it with `props.pluginAlias` in the calls to `prefixTagsIfNeeded()` and
//        `unprefixTagsOwnedByPlugin()`.

export const proxyWorkflows = <TBot extends BaseBot>(props: {
  client: BotSpecificClient<TBot> | client.Client
  pluginAlias?: string
}): WorkflowProxy<TBot> =>
  new Proxy({} as WorkflowProxy<TBot>, {
    get: <TWorkflowName extends typeUtils.StringKeys<TBot['workflows']>>(_: unknown, workflowName: TWorkflowName) =>
      ({
        listInstances: (input) =>
          createAsyncCollection(({ nextToken }) =>
            props.client
              .listWorkflows({
                ...input,
                name: workflowName as typeUtils.Cast<TWorkflowName, string>,
                nextToken,
              })
              .then(({ meta, workflows }) => ({
                meta,
                items: workflows.map((workflow) => wrapWorkflowInstance<TBot, TWorkflowName>({ ...props, workflow })),
              }))
          ),
        startNewInstance: async (input) => {
          const { workflow } = await props.client.createWorkflow({
            name: workflowName as typeUtils.Cast<TWorkflowName, string>,
            status: 'pending',
            ...prefixTagsIfNeeded(input, { alias: undefined /* props.pluginAlias */ }),
          })
          return { workflow: wrapWorkflowInstance<TBot, TWorkflowName>({ ...props, workflow }) }
        },
      }) satisfies WorkflowProxy<TBot>[TWorkflowName],
  })

export const wrapWorkflowInstance = <
  TBot extends BaseBot,
  TWorkflowName extends typeUtils.StringKeys<TBot['workflows']>,
>(props: {
  client: BotSpecificClient<TBot> | client.Client
  workflow: client.Workflow
  event?: botServerTypes.WorkflowUpdateEvent
  onWorkflowUpdate?: (newState: client.Workflow) => Promise<void> | void
  pluginAlias?: string
}): ActionableWorkflow<TBot, TWorkflowName> => {
  let isAcknowledged = false

  return {
    ...(unprefixTagsOwnedByPlugin(props.workflow, { alias: undefined /* props.pluginAlias */ }) as ActionableWorkflow<
      TBot,
      TWorkflowName
    >),

    async update(x) {
      const { workflow } = await props.client.updateWorkflow({
        id: props.workflow.id,
        ...prefixTagsIfNeeded(x, { alias: undefined /* props.pluginAlias */ }),
      })
      await props.onWorkflowUpdate?.(workflow)

      return { workflow: wrapWorkflowInstance<TBot, TWorkflowName>({ ...props, workflow }) }
    },

    async acknowledgeStartOfProcessing() {
      if (!props.event || props.workflow.status !== 'pending' || isAcknowledged) {
        return {
          workflow: wrapWorkflowInstance<TBot, TWorkflowName>(props),
        }
      }

      const { workflow } = await props.client.updateWorkflow({
        id: props.workflow.id,
        status: 'in_progress',
        eventId: props.event.id,
      })
      isAcknowledged = true

      await props.onWorkflowUpdate?.(workflow)

      return { workflow: wrapWorkflowInstance<TBot, TWorkflowName>({ ...props, workflow }) }
    },

    async setFailed({ failureReason }) {
      const { workflow } = await props.client.updateWorkflow({
        id: props.workflow.id,
        status: 'failed',
        failureReason,
      })

      await props.onWorkflowUpdate?.(workflow)

      return { workflow: wrapWorkflowInstance<TBot, TWorkflowName>({ ...props, workflow }) }
    },

    async setCompleted({ output } = {}) {
      const { workflow } = await props.client.updateWorkflow({ id: props.workflow.id, status: 'completed', output })
      await props.onWorkflowUpdate?.(workflow)

      return { workflow: wrapWorkflowInstance<TBot, TWorkflowName>({ ...props, workflow }) }
    },

    async cancel() {
      const { workflow } = await props.client.updateWorkflow({ id: props.workflow.id, status: 'cancelled' })
      await props.onWorkflowUpdate?.(workflow)

      return { workflow: wrapWorkflowInstance<TBot, TWorkflowName>({ ...props, workflow }) }
    },
  }
}
