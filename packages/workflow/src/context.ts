import { AsyncLocalStorage } from 'node:async_hooks'
import type { Workflow as WorkflowType } from '@botpress/client'
import type { BotSpecificClient } from '@botpress/sdk/src/bot'
import { UnexpectedError } from './error'

export type Client = BotSpecificClient<any>

type StepContext = { output: unknown; attempts: number; i?: number; steps?: Record<string, StepContext> }

export type WorkflowContext = {
  workflow: WorkflowType
  client: Client
  abort: () => void
  aborted: boolean
  state: State
}

type State = {
  executionCount: number
  steps: Record<string, StepContext>
}

export const storage = new AsyncLocalStorage<WorkflowContext>()

export const getContext = () => {
  const ctx = storage.getStore()

  if (!ctx) {
    throw new UnexpectedError('No workflow context found')
  }

  return ctx
}

export const saveState = async ({
  client,
  state,
  workflowId,
}: {
  state: State
  workflowId: string
  client: Client
}) => {
  await client.setState({
    type: 'workflow',
    name: 'context',
    payload: state,
    id: workflowId,
  })
}

export const getOrSetState = async ({ client, workflowId }: { client: Client; workflowId: string }) => {
  const state = await client.getOrSetState({
    id: workflowId,
    type: 'workflow',
    name: 'context',
    payload: {
      executionCount: 1,
      steps: {},
    },
  })

  return state.state.payload as State
}
