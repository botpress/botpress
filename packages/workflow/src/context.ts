import { AsyncLocalStorage } from 'node:async_hooks'
import type { Workflow as WorkflowType } from '@botpress/client'
import type { BotSpecificClient } from '@botpress/sdk/src/bot'

export type Client = BotSpecificClient<any>

export type WorkflowContext = {
  workflow: WorkflowType
  client: Client
  abort: () => void
  aborted: boolean
  state: {
    executionCount: number
    steps: Record<string, { output: unknown; attempts: number }>
  }
}

export const storage = new AsyncLocalStorage<WorkflowContext>()

export const getContext = () => {
  const ctx = storage.getStore()

  if (!ctx) {
    throw new Error('No workflow context found')
  }

  return ctx
}

export const saveState = async ({ client, state, workflowId }: { state: any; workflowId: string; client: Client }) => {
  await client.setState({
    type: 'workflow',
    name: 'state',
    payload: state,
    id: workflowId,
  })
}
