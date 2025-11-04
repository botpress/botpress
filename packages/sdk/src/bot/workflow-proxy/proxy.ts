import type * as client from '@botpress/client'
import { prefixTagsIfNeeded, unprefixTagsOwnedByPlugin } from '../../plugin/tag-prefixer'
import { AsyncCollection, createAsyncCollection } from '../../utils/api-paging-utils'
import type { BotSpecificClient } from '../../bot'
import type * as typeUtils from '../../utils/type-utils'
import type { BaseBot } from '../common'
import * as botServerTypes from '../server/types'
import type { WorkflowProxy, WorkflowWithUtilities } from './types'

export const proxyWorkflows = <TBot extends BaseBot>(props: {
  client: BotSpecificClient<TBot> | client.Client
  pluginAlias?: string
}): WorkflowProxy<TBot> =>
  new Proxy({} as WorkflowProxy<TBot>, {
    get: <TWorkflowName extends typeUtils.StringKeys<TBot['workflows']>>(_: unknown, workflowName: TWorkflowName) =>
      ({
        listInstances: {
          all: (input) => _listWorkflows({ ...props, workflowName, input }),
          running: (input) => _listWorkflows({ ...props, workflowName, input, statuses: ['in_progress'] }),
          scheduled: (input) => _listWorkflows({ ...props, workflowName, input, statuses: ['pending', 'listening'] }),
          allActive: (input) =>
            _listWorkflows({ ...props, workflowName, input, statuses: ['in_progress', 'pending', 'listening'] }),
          allFinished: (input) =>
            _listWorkflows({
              ...props,
              workflowName,
              input,
              statuses: ['completed', 'cancelled', 'failed', 'timedout'],
            }),
          cancelled: (input) => _listWorkflows({ ...props, workflowName, input, statuses: ['cancelled'] }),
          failed: (input) => _listWorkflows({ ...props, workflowName, input, statuses: ['failed'] }),
          succeeded: (input) => _listWorkflows({ ...props, workflowName, input, statuses: ['completed'] }),
          timedOut: (input) => _listWorkflows({ ...props, workflowName, input, statuses: ['timedout'] }),
        },
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

const _listWorkflows = <TBot extends BaseBot, TWorkflowName extends typeUtils.StringKeys<TBot['workflows']>>(props: {
  workflowName: TWorkflowName
  client: BotSpecificClient<TBot> | client.Client
  statuses?: client.ClientInputs['listWorkflows']['statuses']
  input?: Pick<client.ClientInputs['listWorkflows'], 'nextToken' | 'conversationId' | 'userId'> & {
    tags?: typeUtils.AtLeastOneProperty<TBot['workflows'][TWorkflowName]['tags']>
  }
  pluginAlias?: string
}): AsyncCollection<WorkflowWithUtilities<TBot, TWorkflowName>> =>
  createAsyncCollection(async ({ nextToken }) =>
    props.client
      .listWorkflows({
        ...props.input,
        name: props.workflowName as any,
        statuses: props.statuses,
        nextToken,
      })
      .then(({ meta, workflows }) => ({
        meta,
        items: workflows.map((workflow) => wrapWorkflowInstance<TBot, TWorkflowName>({ ...props, workflow })),
      }))
  )

export const wrapWorkflowInstance = <
  TBot extends BaseBot,
  TWorkflowName extends typeUtils.StringKeys<TBot['workflows']>,
>(props: {
  client: BotSpecificClient<TBot> | client.Client
  workflow: client.Workflow
  event?: botServerTypes.WorkflowUpdateEvent
  onWorkflowUpdate?: (newState: client.Workflow) => Promise<void> | void
  pluginAlias?: string
}): WorkflowWithUtilities<TBot, TWorkflowName> => {
  let isAcknowledged = false

  return {
    ...((props.pluginAlias
      ? unprefixTagsOwnedByPlugin(props.workflow, { alias: props.pluginAlias })
      : props.workflow) as WorkflowWithUtilities<TBot, TWorkflowName>),

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
