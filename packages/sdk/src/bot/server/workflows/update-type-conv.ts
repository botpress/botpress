import * as types from '../types'

export const bridgeUpdateTypeToSnakeCase = (updateType: types.BridgeWorkflowUpdateType): types.WorkflowUpdateType => {
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
