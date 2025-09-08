import { type Event } from '@botpress/client'
import { z } from '@botpress/sdk'
import { type Client, getOrSetState, storage, type WorkflowContext } from './context'
import { AbortError, isWorkflowError } from './error'
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
    event?: Event
    input: I
    ctx: WorkflowContext
    step: Step
    wait: Wait
  }) => Promise<O>
}

export const workflow = <I, O>({ run, name }: WorkflowParams<I, O>) => {
  return {
    start: async ({
      client,
      input,
      parentWorkflowId,
      tags,
    }: {
      client: Client
      input: I
      parentWorkflowId?: string
      tags?: Record<string, string>
    }) => {
      const { workflow } = await client.createWorkflow({
        name,
        status: 'pending',
        input,
        parentWorkflowId,
        tags,
      })

      return workflow
    },
    run: async ({
      event,
      input,
      client,
      tags,
    }: {
      event: Event
      input: I
      client: Client
      tags?: Record<string, string>
    }) => {
      const workflow = await getOrCreateWorkflow({ client, name, event, input, tags })

      if (!workflow) {
        throw new Error(`Workflow "${name}" not found`)
      }

      if (workflow.status !== 'in_progress') {
        await client.updateWorkflow({ id: workflow.id, status: 'in_progress', eventId: event.id })
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
              await client.updateWorkflow({
                id: workflow.id,
                status: 'failed',
                output: {},
              })

              throw new AbortError()
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
  event: Event
  input?: unknown
  tags?: Record<string, string>
}

const getOrCreateWorkflow = async ({ client, name, event, input, tags }: GetOrCreateWorkflow) => {
  if (event) {
    if (event.type === 'workflow_update' && event.payload.workflow.name === name) {
      return event.payload.workflow
    }

    if (event.workflowId) {
      const { workflow } = await client.getWorkflow({ id: event.workflowId })

      if (workflow.name === name) {
        return workflow
      }
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
      status: 'in_progress',
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
