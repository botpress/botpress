import { AsyncLocalStorage } from 'node:async_hooks'
import type { Workflow as WorkflowType } from '@botpress/client'
import type { BotSpecificClient } from '@botpress/sdk/src/bot'

export type Client = BotSpecificClient<any>

type StepContext = { output: unknown; attempts: number; i?: number; steps?: Record<string, StepContext> }

export type WorkflowContext = {
  workflow: WorkflowType
  client: Client
  abort: () => void
  aborted: boolean
  state: {
    executionCount: number
    steps: Record<string, StepContext>
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

export const saveContext = async ({
  client,
  context,
  workflowId,
}: {
  context: any
  workflowId: string
  client: Client
}) => {
  await client.setState({
    type: 'workflow',
    name: 'context',
    payload: context,
    id: workflowId,
  })
}
