import { getContext } from './context'
import { step } from './step'

export const wait = {
  forWorkflow: async (name: string, { workflowId }: { workflowId: string }) => {
    await step(name, async () => {
      const context = getContext()

      const { workflow } = await context.client.getWorkflow({ id: workflowId })

      if (
        workflow.status === 'completed' ||
        workflow.status === 'failed' ||
        workflow.status === 'cancelled' ||
        workflow.status === 'timedout'
      ) {
        return workflow
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
