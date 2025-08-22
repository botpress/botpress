import { getContext } from './context'
import { FailedError } from './error'
import { step } from './step'

export const wait = {
  forWorkflow: async (
    name: string,
    { workflowId, failOnChildFailure = false }: { workflowId: string; failOnChildFailure?: boolean }
  ) => {
    await step(name, async () => {
      const context = getContext()

      const { workflow } = await context.client.getWorkflow({ id: workflowId })

      const status = workflow.status

      if (failOnChildFailure && (status === 'failed' || status === 'cancelled' || status === 'timedout')) {
        throw new FailedError(`Workflow "${workflow.name}" (${workflowId}) failed`)
      }

      if (
        workflow.status === 'completed' ||
        workflow.status === 'cancelled' ||
        workflow.status === 'timedout' ||
        workflow.status === 'failed'
      ) {
        return
      }

      context.abort()
    })
  },
  listen: async (name: string) => {
    await step(name, async () => {
      const context = getContext()
      await context.client.updateWorkflow({ id: context.workflow.id, status: 'listening' })
      context.abort()
    })
  },
}

export type Wait = typeof wait
