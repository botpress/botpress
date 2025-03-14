import type * as client from '@botpress/client'
import type { BotSpecificClient } from '../../bot'
import type * as typeUtils from '../../utils/type-utils'
import type * as botClient from '../client/types'
import type { BaseBot } from '../common'
import type * as commonTypes from '../common'
import type { WorkflowProxy, WorkflowWithUtilities } from './types'

export const proxyWorkflows = <TBot extends BaseBot>(
  client: BotSpecificClient<TBot> | client.Client
): WorkflowProxy<TBot> =>
  new Proxy({} as WorkflowProxy<TBot>, {
    get: <TWorkflowName extends Extract<keyof TBot['workflows'], string>>(_: unknown, workflowName: TWorkflowName) =>
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
        startNewInstance: (input) =>
          _startNewWorkflowInstance({
            client,
            input: {
              name: workflowName as typeUtils.Cast<TWorkflowName, string>,
              status: 'pending',
              ...input,
            },
          }),
      }) satisfies WorkflowProxy<TBot>[TWorkflowName],
  })

const _listWorkflows = async <TBot extends BaseBot, TWorkflowName extends string>(props: {
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

const _startNewWorkflowInstance = async <TBot extends BaseBot, TWorkflowName extends string>(props: {
  client: BotSpecificClient<TBot> | client.Client
  input: Parameters<botClient.CreateWorkflow<TBot>>[0]
}) => {
  const { workflow } = await props.client.createWorkflow(props.input)
  return { workflow: wrapWorkflowInstance<TBot, TWorkflowName>({ client: props.client, workflow }) }
}

export const wrapWorkflowInstance = <
  TBot extends BaseBot,
  TWorkflowName extends keyof commonTypes.EnumerateWorkflows<TBot>,
>(props: {
  client: BotSpecificClient<TBot> | client.Client
  workflow: client.Workflow
}): WorkflowWithUtilities<TBot, TWorkflowName> => ({
  ...(props.workflow as WorkflowWithUtilities<TBot, TWorkflowName>),

  async update(x) {
    const { workflow } = await props.client.updateWorkflow({ id: props.workflow.id, ...x })
    return { workflow: wrapWorkflowInstance<TBot, TWorkflowName>({ client: props.client, workflow }) }
  },

  async setFailed({ failureReason }) {
    const { workflow } = await props.client.updateWorkflow({
      id: props.workflow.id,
      status: 'failed',
      failureReason,
    })
    return { workflow: wrapWorkflowInstance<TBot, TWorkflowName>({ client: props.client, workflow }) }
  },

  async setCompleted({ output } = {}) {
    const { workflow } = await props.client.updateWorkflow({ id: props.workflow.id, status: 'completed', output })
    return { workflow: wrapWorkflowInstance<TBot, TWorkflowName>({ client: props.client, workflow }) }
  },

  async cancel() {
    const { workflow } = await props.client.updateWorkflow({ id: props.workflow.id, status: 'cancelled' })
    return { workflow: wrapWorkflowInstance<TBot, TWorkflowName>({ client: props.client, workflow }) }
  },
})
