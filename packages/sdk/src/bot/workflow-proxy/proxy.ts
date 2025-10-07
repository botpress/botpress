import type * as client from '@botpress/client'
import type { BotSpecificClient } from '../../bot'
import type * as typeUtils from '../../utils/type-utils'
import type { BaseBot } from '../common'
import * as botServerTypes from '../server/types'
import type { WorkflowProxy, WorkflowWithUtilities } from './types'

export const proxyWorkflows = <TBot extends BaseBot>(
  client: BotSpecificClient<TBot> | client.Client
): WorkflowProxy<TBot> =>
  new Proxy({} as WorkflowProxy<TBot>, {
    get: <TWorkflowName extends typeUtils.StringKeys<TBot['workflows']>>(_: unknown, workflowName: TWorkflowName) =>
      ({
        listInstances: {
          all: (input) => _listWorkflows({ workflowName, client, input }),
          running: (input) => _listWorkflows({ workflowName, client, input, statuses: ['in_progress'] }),
          scheduled: (input) => _listWorkflows({ workflowName, client, input, statuses: ['pending', 'listening'] }),
          allFinished: (input) =>
            _listWorkflows({
              workflowName,
              client,
              input,
              statuses: ['completed', 'cancelled', 'failed', 'timedout'],
            }),
          cancelled: (input) => _listWorkflows({ workflowName, client, input, statuses: ['cancelled'] }),
          failed: (input) => _listWorkflows({ workflowName, client, input, statuses: ['failed'] }),
          succeeded: (input) => _listWorkflows({ workflowName, client, input, statuses: ['completed'] }),
          timedOut: (input) => _listWorkflows({ workflowName, client, input, statuses: ['timedout'] }),
        },
        startNewInstance: async (input) => {
          const { workflow } = await client.createWorkflow({
            name: workflowName as typeUtils.Cast<TWorkflowName, string>,
            status: 'pending',
            ...input,
          })
          return { workflow: wrapWorkflowInstance<TBot, TWorkflowName>({ client, workflow }) }
        },
      }) satisfies WorkflowProxy<TBot>[TWorkflowName],
  })

const _listWorkflows = async <
  TBot extends BaseBot,
  TWorkflowName extends typeUtils.StringKeys<TBot['workflows']>,
>(props: {
  workflowName: TWorkflowName
  client: BotSpecificClient<TBot> | client.Client
  statuses?: client.ClientInputs['listWorkflows']['statuses']
  input?: Pick<client.ClientInputs['listWorkflows'], 'nextToken' | 'conversationId' | 'userId'> & {
    tags?: typeUtils.AtLeastOneProperty<TBot['workflows'][TWorkflowName]['tags']>
  }
}) => {
  const ret = await props.client.listWorkflows({
    name: props.workflowName as any,
    statuses: props.statuses,
    ...props.input,
  })
  return {
    ...ret,
    workflows: ret.workflows.map((workflow) =>
      wrapWorkflowInstance<TBot, TWorkflowName>({ client: props.client, workflow })
    ),
  }
}

export const wrapWorkflowInstance = <
  TBot extends BaseBot,
  TWorkflowName extends typeUtils.StringKeys<TBot['workflows']>,
>(props: {
  client: BotSpecificClient<TBot> | client.Client
  workflow: client.Workflow
  event?: botServerTypes.WorkflowUpdateEvent
  onWorkflowUpdate?: (newState: client.Workflow) => Promise<void> | void
}): WorkflowWithUtilities<TBot, TWorkflowName> => {
  let isAcknowledged = false

  return {
    ...(props.workflow as WorkflowWithUtilities<TBot, TWorkflowName>),

    async update(x) {
      const { workflow } = await props.client.updateWorkflow({ id: props.workflow.id, ...x })
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
