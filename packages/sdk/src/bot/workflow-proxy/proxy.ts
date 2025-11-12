import type * as client from '@botpress/client'
import type { BotSpecificClient } from '../../bot'
import { prefixTagsIfNeeded, unprefixTagsOwnedByPlugin } from '../../plugin/tag-prefixer'
import { createAsyncCollection } from '../../utils/api-paging-utils'
import type * as typeUtils from '../../utils/type-utils'
import type { BaseBot } from '../common'
import * as botServerTypes from '../server/types'
import type { WorkflowProxy, ActionableWorkflow } from './types'

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
            ...input,
            tags:
              input.tags && props.pluginAlias
                ? prefixTagsIfNeeded(input.tags, { alias: props.pluginAlias })
                : undefined,
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
    ...((props.pluginAlias
      ? unprefixTagsOwnedByPlugin(props.workflow, { alias: props.pluginAlias })
      : props.workflow) as ActionableWorkflow<TBot, TWorkflowName>),

    async update(x) {
      const { workflow } = await props.client.updateWorkflow({
        id: props.workflow.id,
        ...x,
        tags: x.tags && props.pluginAlias ? prefixTagsIfNeeded(x.tags, { alias: props.pluginAlias }) : undefined,
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
