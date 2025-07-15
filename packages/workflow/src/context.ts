import { AsyncLocalStorage } from 'node:async_hooks'
import type { Client, Workflow as WorkflowType } from '@botpress/client'

type WorkflowContext = {
  workflow: WorkflowType
  client: Client
  state: {
    executionCount: number
    steps: Record<string, unknown>
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
