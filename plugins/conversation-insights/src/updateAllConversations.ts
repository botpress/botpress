import * as summaryUpdater from './tagsUpdater'
import * as types from './types'
import * as bp from '.botpress'

export type WorkflowProps = types.CommonProps & bp.WorkflowHandlerProps['updateAllConversations']
export const updateAllConversations = async (props: WorkflowProps) => {
  await props.workflow.acknowledgeStartOfProcessing()
  const conversations = props.conversations['*']['*'].list({ tags: { isDirty: 'true' } })
  const dirtyConversations = await conversations.takePage(1)

  const promises: Promise<void>[] = []

  try {
    for (const conversation of dirtyConversations) {
      const firstMessagePage = await conversation.listMessages().takePage(1)
      const promise = summaryUpdater.updateTitleAndSummary({ ...props, conversation, messages: firstMessagePage })
      promises.push(promise)
    }
  } finally {
    await Promise.all(promises)
  }

  if (conversations.isExhausted) {
    await props.workflow.setCompleted()
  }
}
