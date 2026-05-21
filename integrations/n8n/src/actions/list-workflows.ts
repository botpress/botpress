import { wrapAction } from '../action-wrapper'

export const listWorkflows = wrapAction({ actionName: 'listWorkflows' }, async ({ n8nClient }, input) =>
  n8nClient.listWorkflows(input)
)
