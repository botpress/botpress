import * as summaryUpdater from './tagsUpdater'
import * as types from './types'
import * as bp from '.botpress'

export type WorkflowProps = types.CommonProps & bp.WorkflowHandlerProps['updateAllConversations']
export const updateAllConversations = async (props: WorkflowProps) => {
  await props.workflow.acknowledgeStartOfProcessing()
  const dirtyConversations = await props.client.listConversations({ tags: { isDirty: 'true' } })

  const promises: Promise<void>[] = []
  for (const conversation of dirtyConversations.conversations) {
    const firstMessagePage = await props.client
      .listMessages({ conversationId: conversation.id })
      .then((res) => res.messages)
    const promise = summaryUpdater.updateTitleAndSummary({ ...props, conversation, messages: firstMessagePage })
    promises.push(promise)
  }

  await Promise.all(promises)
  if (!dirtyConversations.meta.nextToken) {
    await props.workflow.setCompleted()
  }
}
