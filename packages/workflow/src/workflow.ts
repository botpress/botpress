import { z } from '@botpress/sdk'
import type { WorkflowUpdateEvent } from '@botpress/sdk/src/bot'
import { type Client, getOrSetState, storage, type WorkflowContext } from './context'
import { AbortError, FailedError, isWorkflowError } from './error'
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
      const workflow = await getOrCreateWorkflow({ client, name, event, input })

      if (!workflow) {
        throw new Error(`Workflow "${name}" not found`)
      }

      const state = await getOrSetState({ client, workflowId: workflow.id })

      const ctx = {
        workflow,
        client,
        state,
        abort: () => {
          ctx.aborted = true
        },
        aborted: false,
      }

      const output = await storage.run(ctx, () =>
        run({ ctx, input, step, wait, client }).catch(async (e) => {
          if (isWorkflowError(e)) {
            if (e.type === 'failed') {
              if (e instanceof FailedError) {
                await client.updateWorkflow({
                  id: workflow.id,
                  status: 'failed',
                  output: {},
                })

                throw new AbortError()
              }
            }
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
  tags?: Record<string, string>
}

const getOrCreateWorkflow = async ({ client, name, event, input, tags }: GetOrCreateWorkflow) => {
  if (event) {
    if (event.workflowId) {
      const { workflow } = await client.getWorkflow({ id: event.workflowId })

      if (workflow.name === name) {
        return workflow
      }
    }

    if (event.type === 'workflow_update' && event.payload.workflow.name === name) {
      return event.payload.workflow
    }
  }

  const { workflows } = await client.listWorkflows({
    statuses: ['listening', 'in_progress', 'pending'],
    name,
    tags,
  })

  if (workflows.length === 0) {
    const { workflow } = await client.createWorkflow({
      name,
      status: event ? 'in_progress' : 'pending',
      eventId: event?.id,
      tags,
      input,
    })

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
