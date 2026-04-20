import { updateAllConversations } from '../updateAllConversations'
import * as bp from '.botpress'

export const handleStartUpdateAllConversations: bp.WorkflowHandlers['updateAllConversations'] = async (props) => {
  props.logger.info('Starting updateAllConversations workflow')
  await updateAllConversations(props)

  return undefined
}
export const handleContinueUpdateAllConversations: bp.WorkflowHandlers['updateAllConversations'] = async (props) => {
  await updateAllConversations(props)

  return undefined
}

export const handleTimeoutUpdateAllConversations: bp.WorkflowHandlers['updateAllConversations'] = async (props) => {
  await props.workflow.setFailed({ failureReason: 'Workflow timed out' })
}
