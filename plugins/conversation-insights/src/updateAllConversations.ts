import * as insightFailures from './insight-failures'
import * as summaryUpdater from './tagsUpdater'
import * as types from './types'
import * as bp from '.botpress'

export type WorkflowProps = types.CommonProps & bp.WorkflowHandlerProps['updateAllConversations']

type ConversationProps = WorkflowProps & { conversation: types.ActionableConversation }
type ConversationOutcome = 'insight-updated' | 'failure-recorded' | 'failure-not-recorded'

export const updateAllConversations = async (props: WorkflowProps) => {
  await props.workflow.acknowledgeStartOfProcessing()
  const conversations = props.conversations['*']['*'].list({ tags: { isDirty: 'true' } })
  const dirtyConversations = await conversations.takePage(1)

  // Every promise is handed to Promise.allSettled as soon as it is created. An
  // await between creating two of them would leave a promise that rejects
  // early with no handler, and the Lambda runtime would fail the invocation:
  const results = await Promise.allSettled(
    dirtyConversations.map((conversation) => _updateInsightOrRecordFailure({ ...props, conversation }))
  )
  const hasClearedAnyConversation = results.some(
    (result) => result.status === 'fulfilled' && result.value !== 'failure-not-recorded'
  )

  if (conversations.isExhausted || !hasClearedAnyConversation) {
    await props.workflow.setCompleted()
  }
}

/**
 * Puts every conversation whose last AI insight generation failed back on the
 * list of dirty conversations, so the run that is starting tries each of them
 * once more.
 */
export const markFailedConversationsDirty = async (props: WorkflowProps) => {
  const failedConversations = await props.conversations['*']['*'].list({ tags: { insightStatus: 'failed' } }).takeAll()

  await Promise.allSettled(
    failedConversations.map((conversation) => conversation.update({ tags: { isDirty: 'true' } }))
  )
}

const _updateInsightOrRecordFailure = async (props: ConversationProps): Promise<ConversationOutcome> => {
  try {
    const firstMessagePage = await props.conversation.listMessages().takePage(1)
    await summaryUpdater.updateTitleAndSummary({ ...props, messages: firstMessagePage })

    return 'insight-updated'
  } catch (thrown: unknown) {
    return await _recordFailure({ ...props, thrown })
  }
}

const _recordFailure = async ({
  conversation,
  logger,
  thrown,
}: ConversationProps & { thrown: unknown }): Promise<ConversationOutcome> => {
  logger.error(
    `The AI insight could not be generated for conversation ${conversation.id}: ${_extractErrorMessage(thrown)}`
  )

  try {
    await conversation.update({
      tags: insightFailures.resolveInsightTagsAfterFailure({
        failureCount: conversation.tags.insightFailureCount,
        wasCognitiveUnreachable: insightFailures.isCognitiveUnreachable(thrown),
      }),
    })

    return 'failure-recorded'
  } catch (updateThrown: unknown) {
    logger.error(
      `The failure could not be recorded for conversation ${conversation.id}: ${_extractErrorMessage(updateThrown)}`
    )

    return 'failure-not-recorded'
  }
}

const _extractErrorMessage = (thrown: unknown): string => (thrown instanceof Error ? thrown.message : String(thrown))
