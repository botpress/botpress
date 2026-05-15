import { wrapAction } from '../action-wrapper'

export const triggerWorkflow = wrapAction({ actionName: 'triggerWorkflow' }, async ({ n8nClient }, input) =>
  n8nClient.triggerWorkflowWebhook({
    workflowIdOrName: input.workflowIdOrName,
    body: {
      conversationId: input.conversationId,
      data: input.payload ?? {},
    },
  })
)
