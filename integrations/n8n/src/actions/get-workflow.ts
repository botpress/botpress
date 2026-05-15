import { wrapAction } from '../action-wrapper'

export const getWorkflow = wrapAction({ actionName: 'getWorkflow' }, async ({ n8nClient }, input) => {
  const workflow = await n8nClient.getWorkflow(input.workflowId, input.excludePinnedData ?? true)
  return { workflow }
})
