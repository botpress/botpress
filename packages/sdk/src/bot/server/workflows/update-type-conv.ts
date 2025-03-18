import * as types from '../types'

export const bridgeUpdateTypeToSnakeCase = (
  updateType: types.BridgeWorkflowUpdateType
): types.WorkflowUpdateTypeSnakeCase => {
  switch (updateType) {
    case 'workflow_continued':
      return 'continued'
    case 'workflow_started':
      return 'started'
    case 'workflow_timedout':
      return 'timed_out'
    default:
      throw new Error(`Unsupported workflow update type: ${updateType}`)
  }
}

export const camelCaseUpdateTypeToSnakeCase = (
  updateType: types.WorkflowUpdateTypeCamelCase
): types.WorkflowUpdateTypeSnakeCase => {
  if (updateType !== 'timedOut' && updateType !== 'continued' && updateType !== 'started') {
    updateType satisfies never
  }

  return updateType === 'timedOut' ? 'timed_out' : updateType
}
