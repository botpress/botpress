import { updateAllConversations } from '../updateAllConversations'
import * as bp from '.botpress'

const _updateAllConversationsOrFail = async (props: bp.WorkflowHandlerProps['updateAllConversations']) => {
  try {
    await updateAllConversations(props)
  } catch (thrown: unknown) {
    const error = thrown instanceof Error ? thrown : new Error(String(thrown))
    await props.workflow.setFailed({
      failureReason: `Failed to update conversation insights after the AI call retries were exhausted: ${error.message}`,
    })
  }
}

export const handleStartUpdateAllConversations: bp.WorkflowHandlers['updateAllConversations'] = async (props) => {
  props.logger.info('Starting updateAllConversations workflow')
  await _updateAllConversationsOrFail(props)

  return undefined
}
export const handleContinueUpdateAllConversations: bp.WorkflowHandlers['updateAllConversations'] = async (props) => {
  await _updateAllConversationsOrFail(props)

  return undefined
}

export const handleTimeoutUpdateAllConversations: bp.WorkflowHandlers['updateAllConversations'] = async (props) => {
  await props.workflow.setFailed({ failureReason: 'Workflow timed out' })
}
