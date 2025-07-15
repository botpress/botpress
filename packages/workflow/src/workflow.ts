import type { Client } from '@botpress/client'
import type { WorkflowUpdateEvent } from '@botpress/sdk/src/bot'
import { storage } from './context'

type WorkflowParams<T> = {
  client: Client
  name: string
  event?: WorkflowUpdateEvent
  run: () => Promise<T>
}

export const workflow = async <T>({ client, run, name, event }: WorkflowParams<T>) => {
  const workflow =
    event && event.payload.workflow.name === name
      ? event.payload.workflow
      : await getOrCreateWorkflow({ client, name, event })

  if (!workflow) {
    throw new Error(`Workflow "${name}" not found`)
  }

  const state = await client.getOrSetState({
    id: workflow.id,
    type: 'workflow',
    payload: {
      executionCount: 0,
      steps: {},
    },
    name: 'state',
  })

  state.state.payload.executionCount++

  const output = await storage.run({ workflow, client, state: state.state.payload as any }, run)

  console.log('OUTPUT:', output)

  await client.updateWorkflow({
    id: workflow.id,
    status: 'completed',
    output: {
      result: output,
    },
  })

  return output
}

type GetOrCreateWorkflow = {
  client: Client
  name: string
  event?: WorkflowUpdateEvent
}

const getOrCreateWorkflow = async ({ client, name, event }: GetOrCreateWorkflow) => {
  const { workflows } = await client.listWorkflows({
    statuses: ['listening'],
    name,
  })

  if (workflows.length === 0) {
    const { workflow } = await client.createWorkflow({
      name,
      status: event ? 'in_progress' : 'pending',
      eventId: event?.id,
    })

    // TODO remove this
    await client.updateWorkflow({ id: workflow.id, status: 'listening' })

    return workflow
  }

  const firstWorkflow = workflows[0]

  if (workflows.length > 1) {
    throw new Error(`Multiple workflows found with name "${name}"`)
  }

  if (!firstWorkflow) {
    return undefined
  }

  if (firstWorkflow.status === 'paused') {
    throw new Error(`Workflow "${name}" is paused`)
  }

  return firstWorkflow
}
