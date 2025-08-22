import { z } from '@botpress/sdk'
import type { WorkflowUpdateEvent } from '@botpress/sdk/src/bot'
import { type Client, saveContext, storage, type WorkflowContext } from './context'
import { AbortError, FailedError } from './error'
import { type Step, step } from './step'
import { type Wait, wait } from './wait'

type WorkflowParams<I, O> = {
  name: string
  input: z.ZodType<I>
  output: z.ZodType<O>
  run: ({
    client,
    event,
    input,
    ctx,
    step,
    wait,
  }: {
    client: Client
    event?: WorkflowUpdateEvent
    input: I
    ctx: WorkflowContext
    step: Step
    wait: Wait
  }) => Promise<O>
}

export const workflow = <I, O>({ run, name }: WorkflowParams<I, O>) => {
  return {
    start: async ({ client, input, parentWorkflowId }: { client: Client; input: I; parentWorkflowId?: string }) => {
      const { workflow } = await client.createWorkflow({
        name,
        status: 'pending',
        input,
        parentWorkflowId,
      })

      return workflow
    },
    run: async ({ event, input, client }: { event?: WorkflowUpdateEvent; input: I; client: Client }) => {
      const workflow =
        event && event.payload.workflow.name === name && event.type === 'workflow_update'
          ? event.payload.workflow
          : await getOrCreateWorkflow({ client, name, event, input })

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
        name: 'context',
      })

      state.state.payload.executionCount++

      await saveContext({ client, context: state.state.payload as any, workflowId: workflow.id })

      const ctx = {
        workflow,
        client,
        state: state.state.payload as any,
        abort: () => {
          ctx.aborted = true
        },
        aborted: false,
      }

      const output = await storage.run(ctx, () =>
        run({ ctx, input, step, wait }).catch(async (e) => {
          if (e instanceof FailedError) {
            await client.updateWorkflow({
              id: workflow.id,
              status: 'failed',
              output: {},
            })

            throw new AbortError()
          }

          throw e
        })
      )

      await client.updateWorkflow({
        id: workflow.id,
        status: 'completed',
        output: {
          result: output,
        },
      })

      return output
    },
  }
}

type GetOrCreateWorkflow = {
  client: Client
  name: string
  event?: WorkflowUpdateEvent
  input?: unknown
}

const getOrCreateWorkflow = async ({ client, name, event, input }: GetOrCreateWorkflow) => {
  const { workflows } = await client.listWorkflows({
    statuses: ['listening'],
    name,
  })

  if (workflows.length === 0) {
    const { workflow } = await client.createWorkflow({
      name,
      status: event ? 'in_progress' : 'pending',
      eventId: event?.id,
      input,
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
