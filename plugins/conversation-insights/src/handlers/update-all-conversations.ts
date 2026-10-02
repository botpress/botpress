import { markFailedConversationsDirty, updateAllConversations } from '../updateAllConversations'
import * as bp from '.botpress'

export const handleStartUpdateAllConversations: bp.WorkflowHandlers['updateAllConversations'] = async (props) => {
  props.logger.info('Starting updateAllConversations workflow')
  await _failWorkflowOnError({
    props,
    run: async () => {
      await markFailedConversationsDirty(props)
      await updateAllConversations(props)
    },
  })

  return undefined
}
export const handleContinueUpdateAllConversations: bp.WorkflowHandlers['updateAllConversations'] = async (props) => {
  await _failWorkflowOnError({ props, run: () => updateAllConversations(props) })

  return undefined
}

export const handleTimeoutUpdateAllConversations: bp.WorkflowHandlers['updateAllConversations'] = async (props) => {
  await props.workflow.setFailed({ failureReason: 'Workflow timed out' })
}

const _failWorkflowOnError = async ({
  props,
  run,
}: {
  props: bp.WorkflowHandlerProps['updateAllConversations']
  run: () => Promise<void>
}) => {
  try {
    await run()
  } catch (thrown: unknown) {
    const message = thrown instanceof Error ? thrown.message : String(thrown)
    await props.workflow.setFailed({ failureReason: `Failed to update conversation insights: ${message}` })
  }
}
